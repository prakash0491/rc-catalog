import { InquiryStatus, Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export const ADMIN_INQUIRIES_PAGE_SIZE = 10;

export async function listAdminInquiries(params: {
  search?: string;
  status?: InquiryStatus;
  page: number;
  limit: number;
}) {
  const where: Prisma.InquiryWhereInput = {};

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
      { phone: { contains: params.search, mode: 'insensitive' } },
      { message: { contains: params.search, mode: 'insensitive' } },
      { product: { name: { contains: params.search, mode: 'insensitive' } } },
    ];
  }

  if (params.status) {
    where.status = params.status;
  }

  const [items, total] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      include: {
        product: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    }),
    prisma.inquiry.count({ where }),
  ]);

  return {
    items: items.map((inquiry) => ({
      id: inquiry.id,
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      message: inquiry.message,
      status: inquiry.status,
      productName: inquiry.product?.name ?? null,
      productSlug: inquiry.product?.slug ?? null,
      createdAt: inquiry.createdAt.toISOString(),
    })),
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.limit)),
    },
  };
}

export async function updateInquiryStatus(id: string, status: InquiryStatus) {
  const inquiry = await prisma.inquiry.update({
    where: { id },
    data: { status },
  });

  return {
    id: inquiry.id,
    status: inquiry.status,
  };
}
