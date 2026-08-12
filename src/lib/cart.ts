import 'server-only';

import { prisma } from '@/lib/prisma';
import type { CustomerSession } from '@/lib/auth/customer-types';

// ─── Cart helpers ────────────────────────────────────────────

export async function getOrCreateGuestCart(guestSessionId: string) {
  let cart = await prisma.cart.findUnique({
    where: { guestSessionId },
    include: {
      items: {
        include: {
          product: { select: { id: true, slug: true, name: true, price: true, mrp: true, stockQuantity: true, stockStatus: true, images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } } } },
          variant: { select: { id: true, optionName: true, optionValue: true, priceOverride: true } },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { guestSessionId },
      include: {
        items: {
          include: {
            product: { select: { id: true, slug: true, name: true, price: true, mrp: true, stockQuantity: true, stockStatus: true, images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } } } },
            variant: { select: { id: true, optionName: true, optionValue: true, priceOverride: true } },
          },
        },
      },
    });
  }

  return cart;
}

export async function getOrCreateCustomerCart(customerId: string) {
  let cart = await prisma.cart.findUnique({
    where: { customerId },
    include: {
      items: {
        include: {
          product: { select: { id: true, slug: true, name: true, price: true, mrp: true, stockQuantity: true, stockStatus: true, images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } } } },
          variant: { select: { id: true, optionName: true, optionValue: true, priceOverride: true } },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { customerId },
      include: {
        items: {
          include: {
            product: { select: { id: true, slug: true, name: true, price: true, mrp: true, stockQuantity: true, stockStatus: true, images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } } } },
            variant: { select: { id: true, optionName: true, optionValue: true, priceOverride: true } },
          },
        },
      },
    });
  }

  return cart;
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

  if (quantity < 1) {
    throw new Error('INVALID_QUANTITY');
  }

  if (variantId) {
    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, productId, isActive: true },
    });

    if (!variant) {
      throw new Error('VARIANT_NOT_FOUND');
    }

    if (quantity > variant.stockQuantity) {
      throw new Error('INSUFFICIENT_STOCK');
    }
  } else if (quantity > product.stockQuantity) {
    throw new Error('INSUFFICIENT_STOCK');
  }

  // Check for existing item
  const existing = await prisma.cartItem.findFirst({
    where: { cartId, productId, variantId: variantId ?? undefined },
  });

  if (existing) {
    return prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
      include: {
        product: { select: { id: true, slug: true, name: true, price: true, mrp: true, stockQuantity: true, stockStatus: true, images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } } } },
        variant: { select: { id: true, optionName: true, optionValue: true, priceOverride: true } },
      },
    });
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
  if (quantity < 1) {
    await prisma.cartItem.delete({ where: { id: cartItemId } });
    return null;
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
  await prisma.cartItem.delete({ where: { id: cartItemId, cartId } });
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