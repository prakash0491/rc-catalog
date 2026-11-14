import 'server-only';

import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import type { CustomerSession } from '@/lib/auth/customer-types';

// ─── Cart helpers ────────────────────────────────────────────

const CART_ITEMS_INCLUDE = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          price: true,
          mrp: true,
          stockQuantity: true,
          stockStatus: true,
          images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } },
        },
      },
      variant: { select: { id: true, optionName: true, optionValue: true, priceOverride: true } },
    },
  },
} satisfies Prisma.CartInclude;

export async function getOrCreateGuestCart(guestSessionId: string) {
  // Concurrent first-time requests must not race on the unique cart owner.
  return prisma.cart.upsert({
    where: { guestSessionId },
    create: { guestSessionId },
    update: {},
    include: CART_ITEMS_INCLUDE,
  });
}

export async function getOrCreateCustomerCart(customerId: string) {
  return prisma.cart.upsert({
    where: { customerId },
    create: { customerId },
    update: {},
    include: CART_ITEMS_INCLUDE,
  });
}

export type CartWithItems = Awaited<ReturnType<typeof getOrCreateCustomerCart>>;

// ─── Add to cart ─────────────────────────────────────────────

export async function addItemToCart(cartId: string, productId: string, variantId: string | null, quantity: number) {
  // Validate product visibility
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true, status: 'PUBLISHED', deletedAt: null },
  });

  if (!product) {
    throw new Error('PRODUCT_NOT_FOUND');
  }

  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw new Error('INVALID_QUANTITY');
  }

  let availableStock = product.stockQuantity;
  if (variantId) {
    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, productId, isActive: true },
    });

    if (!variant) {
      throw new Error('VARIANT_NOT_FOUND');
    }

    availableStock = variant.stockQuantity;
  }

  // Check for existing item
  const existing = await prisma.cartItem.findFirst({
    where: { cartId, productId, variantId },
  });

  if (existing) {
    if (existing.quantity + quantity > availableStock) {
      throw new Error('INSUFFICIENT_STOCK');
    }
    return prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
      include: {
        product: { select: { id: true, slug: true, name: true, price: true, mrp: true, stockQuantity: true, stockStatus: true, images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } } } },
        variant: { select: { id: true, optionName: true, optionValue: true, priceOverride: true } },
      },
    });
  }

  if (quantity > availableStock) {
    throw new Error('INSUFFICIENT_STOCK');
  }

  return prisma.cartItem.create({
    data: { cartId, productId, variantId, quantity },
    include: {
      product: { select: { id: true, slug: true, name: true, price: true, mrp: true, stockQuantity: true, stockStatus: true, images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } } } },
      variant: { select: { id: true, optionName: true, optionValue: true, priceOverride: true } },
    },
  });
}

// ─── Update cart item quantity ──────────────────────────────

export async function updateCartItemQuantity(cartItemId: string, cartId: string, quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new Error('INVALID_QUANTITY');
  }
  const existing = await prisma.cartItem.findFirst({
    where: { id: cartItemId, cartId },
    include: { product: { select: { stockQuantity: true } }, variant: { select: { stockQuantity: true } } },
  });

  if (!existing) {
    throw new Error('CART_ITEM_NOT_FOUND');
  }

  if (quantity < 1) {
    await prisma.cartItem.deleteMany({ where: { id: cartItemId, cartId } });
    return null;
  }

  const availableStock = existing.variant?.stockQuantity ?? existing.product.stockQuantity;
  if (quantity > availableStock) {
    throw new Error('INSUFFICIENT_STOCK');
  }

  return prisma.cartItem.update({
    where: { id: cartItemId, cartId },
    data: { quantity },
    include: {
      product: { select: { id: true, slug: true, name: true, price: true, mrp: true, stockQuantity: true, stockStatus: true, images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } } } },
      variant: { select: { id: true, optionName: true, optionValue: true, priceOverride: true } },
    },
  });
}

// ─── Remove cart item ────────────────────────────────────────

export async function removeCartItem(cartItemId: string, cartId: string) {
  await prisma.cartItem.deleteMany({ where: { id: cartItemId, cartId } });
}

// ─── Merge guest cart into customer cart ────────────────────

export async function mergeGuestCartIntoCustomerCart(guestSessionId: string, customerId: string) {
  const guestCart = await prisma.cart.findUnique({
    where: { guestSessionId },
    include: { items: true },
  });

  if (!guestCart || guestCart.items.length === 0) {
    // Clean up empty guest cart
    if (guestCart) {
      await prisma.cart.delete({ where: { id: guestCart.id } });
    }
    return;
  }

  const customerCart = await getOrCreateCustomerCart(customerId);

  for (const guestItem of guestCart.items) {
    const existing = customerCart.items.find(
      (item) => item.productId === guestItem.productId && (item.variantId ?? null) === (guestItem.variantId ?? null)
    );

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + guestItem.quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: customerCart.id,
          productId: guestItem.productId,
          variantId: guestItem.variantId,
          quantity: guestItem.quantity,
        },
      });
    }
  }

  // Delete guest cart
  await prisma.cart.delete({ where: { id: guestCart.id } });
}

/**
 * Signing in must not fail just because a guest cart could not be merged.
 * The guest cookie is only cleared when the merge succeeds.
 */
export async function mergeGuestCartSafely(guestSessionId: string, customerId: string) {
  try {
    await mergeGuestCartIntoCustomerCart(guestSessionId, customerId);
    return true;
  } catch (error) {
    console.error('Guest cart merge failed:', error);
    return false;
  }
}

// ─── Get cart count ──────────────────────────────────────────

export async function getCartItemCount(customer: CustomerSession | null, guestSessionId: string | null) {
  if (customer) {
    const cart = await prisma.cart.findUnique({
      where: { customerId: customer.id },
      select: { _count: { select: { items: true } } },
    });
    return cart?._count.items ?? 0;
  }

  if (guestSessionId) {
    const cart = await prisma.cart.findUnique({
      where: { guestSessionId },
      select: { _count: { select: { items: true } } },
    });
    return cart?._count.items ?? 0;
  }

  return 0;
}
