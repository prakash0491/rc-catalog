import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { buildApiError, buildApiSuccess } from '@/lib/api-utils';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: {
        slug,
        isActive: true,
      },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!product) {
      return Response.json(buildApiError('Product not found.', 'NOT_FOUND'), { status: 404 });
    }

    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return Response.json(
      buildApiSuccess({
        product,
        relatedProducts,
      })
    );
  } catch {
    return Response.json(buildApiError('Unable to load product.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}
