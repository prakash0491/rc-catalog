import { InquiryStatus, ProductStatus, StockStatus } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export async function getAdminDashboardData() {
  const [
    totalProducts,
    publishedProducts,
    draftProducts,
    archivedProducts,
    lowStockProducts,
    outOfStockProducts,
    openInquiries,
    recentProducts,
    recentInquiries,
  ] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { deletedAt: null, status: ProductStatus.PUBLISHED } }),
    prisma.product.count({ where: { deletedAt: null, status: ProductStatus.DRAFT } }),
    prisma.product.count({ where: { deletedAt: { not: null } } }),
    prisma.product.count({ where: { deletedAt: null, stockStatus: StockStatus.LOW_STOCK } }),
    prisma.product.count({ where: { deletedAt: null, stockStatus: StockStatus.OUT_OF_STOCK } }),
    prisma.inquiry.count({ where: { status: { not: InquiryStatus.CLOSED } } }),
    prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        stockQuantity: true,
        stockStatus: true,
        updatedAt: true,
      },
    }),
    prisma.inquiry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        product: {
          select: { name: true, slug: true },
        },
      },
    }),
  ]);

  return {
    stats: {
      totalProducts,
      publishedProducts,
      draftProducts,
      archivedProducts,
      lowStockProducts,
      outOfStockProducts,
      openInquiries,
    },
    recentProducts,
    recentInquiries: recentInquiries.map((inquiry) => ({
      id: inquiry.id,
      name: inquiry.name,
      email: inquiry.email,
      status: inquiry.status,
      productName: inquiry.product?.name ?? null,
      createdAt: inquiry.createdAt.toISOString(),
    })),
  };
}
