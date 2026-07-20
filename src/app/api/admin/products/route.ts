import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

import { buildApiError, buildApiSuccess, parsePaginationParams, parseQueryParam } from '@/lib/api-utils';
import { ADMIN_AUTH_COOKIE, verifyAdminSession } from '@/lib/auth/server';
import {
  buildImageInputs,
  buildProductFormInput,
  getAdminProductsList,
  resolveUniqueProductSlug,
  serializeAdminProduct,
} from '@/lib/admin-products';
import { prisma } from '@/lib/prisma';

async function requireAdminSession(request: NextRequest) {
  const token = request.cookies.get(ADMIN_AUTH_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifyAdminSession(token);
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);

    if (!session) {
      return NextResponse.json(buildApiError('Unauthorized.', 'UNAUTHORIZED'), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = parseQueryParam(searchParams.get('search') ?? undefined);
    const categoryId = parseQueryParam(searchParams.get('category') ?? undefined);
    const { page, limit } = parsePaginationParams(searchParams.get('page') ?? undefined, searchParams.get('limit') ?? undefined);

    const data = await getAdminProductsList({ search, categoryId, page, limit });

    return NextResponse.json(buildApiSuccess(data));
  } catch {
    return NextResponse.json(buildApiError('Unable to load admin products.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);

    if (!session) {
      return NextResponse.json(buildApiError('Unauthorized.', 'UNAUTHORIZED'), { status: 401 });
    }

    const formData = await request.formData();
    const input = buildProductFormInput(formData);
    const slug = await resolveUniqueProductSlug(input.slug || input.name);
    const images = buildImageInputs(input.images);

    const createdProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: input.name,
          slug,
          shortDescription: input.shortDescription,
          description: input.description,
          price: new Prisma.Decimal(input.price),
          categoryId: input.categoryId,
          featured: input.featured,
          newArrival: input.newArrival,
          stockStatus: input.stockStatus,
          isActive: input.isActive,
        },
      });

      if (images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((image) => ({
            productId: product.id,
            url: image.url,
            alt: input.name,
            sortOrder: image.sortOrder,
          })),
        });
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          category: true,
          images: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    });

    if (!createdProduct) {
      return NextResponse.json(buildApiError('Unable to create the product.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
    }

    return NextResponse.json(buildApiSuccess(serializeAdminProduct(createdProduct)), { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(buildApiError('Invalid product data.', 'INVALID_INPUT'), { status: 400 });
    }

    return NextResponse.json(buildApiError('Unable to create the product.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}
