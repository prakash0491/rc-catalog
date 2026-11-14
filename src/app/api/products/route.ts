import { NextRequest } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { buildApiError, buildApiSuccess, parsePaginationParams, parseQueryParam } from '@/lib/api-utils';

const listProductsSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  featured: z.enum(['true', 'false']).optional(),
  newArrival: z.enum(['true', 'false']).optional(),
  sort: z.enum(['featured', 'newest', 'price-asc', 'price-desc', 'name-asc']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = listProductsSchema.parse(Object.fromEntries(searchParams.entries()));

    const { page, limit } = parsePaginationParams(params.page, params.limit);
    const category = parseQueryParam(params.category);
    const search = parseQueryParam(params.search);
    const featured = params.featured === 'true' ? true : params.featured === 'false' ? false : undefined;
    const newArrival = params.newArrival === 'true' ? true : params.newArrival === 'false' ? false : undefined;

    const where: Record<string, unknown> = {
      isActive: true,
      status: 'PUBLISHED',
      deletedAt: null,
      category: { isActive: true },
    };

    if (category) {
      where.category = {
        slug: category,
        isActive: true,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (featured !== undefined) {
      where.featured = featured;
    }

    if (newArrival !== undefined) {
      where.newArrival = newArrival;
    }

    let orderBy: Record<string, unknown> = { createdAt: 'desc' };
    switch (params.sort) {
      case 'featured':
        orderBy = { featured: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'price-asc':
        orderBy = { price: 'asc' };
        break;
      case 'price-desc':
        orderBy = { price: 'desc' };
        break;
      case 'name-asc':
        orderBy = { name: 'asc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          images: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return Response.json(
      buildApiSuccess({
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(buildApiError('Invalid query parameters.', 'INVALID_QUERY'), { status: 400 });
    }

    return Response.json(buildApiError('Unable to load products.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}
