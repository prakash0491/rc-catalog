import { prisma } from '@/lib/prisma';
import { buildApiError, buildApiSuccess } from '@/lib/api-utils';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        status: 'PUBLISHED',
        deletedAt: null,
        category: { isActive: true },
        featured: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 12,
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return Response.json(buildApiSuccess(products));
  } catch {
    return Response.json(buildApiError('Unable to load featured products.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}
