import { prisma } from '@/lib/prisma';
import { buildApiSuccess } from '@/lib/api-utils';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        newArrival: true,
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
    return Response.json(buildApiSuccess([]));
  }
}
