import 'server-only';

import { prisma } from '@/lib/prisma';

const WISHLIST_PRODUCT_SELECT = {
  id: true,
  slug: true,
  name: true,
  shortDescription: true,
  price: true,
  mrp: true,
  discountPercent: true,
  stockQuantity: true,
  stockStatus: true,
  images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } },
  category: { select: { name: true, slug: true } },
} as const;

export async function getWishlistForCustomer(customerId: string) {
  return prisma.wishlistItem.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        select: WISHLIST_PRODUCT_SELECT,
      },
    },
  });
}

export async function getWishlistProductIds(customerId: string): Promise<string[]> {
  const items = await prisma.wishlistItem.findMany({
    where: { customerId },
    select: { productId: true },
  });

  return items.map((item) => item.productId);
}

export async function isProductWishlisted(customerId: string, productId: string) {
  const item = await prisma.wishlistItem.findUnique({
    where: { customerId_productId: { customerId, productId } },
    select: { id: true },
  });

  return Boolean(item);
}

export async function addProductToWishlist(customerId: string, productId: string) {
  // Only published, active, non-deleted products can be wishlisted.
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true, status: 'PUBLISHED', deletedAt: null },
    select: { id: true },
  });

  if (!product) {
    throw new Error('PRODUCT_NOT_FOUND');
  }

  return prisma.wishlistItem.upsert({
    where: { customerId_productId: { customerId, productId } },
    create: { customerId, productId },
    update: {},
  });
}

export async function removeProductFromWishlist(customerId: string, productId: string) {
  await prisma.wishlistItem.deleteMany({
    where: { customerId, productId },
  });
}

export async function toggleWishlistItem(customerId: string, productId: string) {
  const existing = await isProductWishlisted(customerId, productId);

  if (existing) {
    await removeProductFromWishlist(customerId, productId);
    return { wishlisted: false };
  }

  await addProductToWishlist(customerId, productId);
  return { wishlisted: true };
}

export async function getWishlistCount(customerId: string) {
  return prisma.wishlistItem.count({ where: { customerId } });
}