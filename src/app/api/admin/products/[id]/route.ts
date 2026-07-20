import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { buildApiError, buildApiSuccess } from '@/lib/api-utils';
import { ADMIN_AUTH_COOKIE, verifyAdminSession } from '@/lib/auth/server';
import {
  buildImageInputs,
  buildProductFormInput,
  getAdminProductById,
  resolveUniqueProductSlug,
  serializeAdminProduct,
} from '@/lib/admin-products';
import { prisma } from '@/lib/prisma';

const idSchema = z.object({
  id: z.string().min(1),
});

async function requireAdminSession(request: NextRequest) {
  const token = request.cookies.get(ADMIN_AUTH_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifyAdminSession(token);
}

async function getValidatedProduct(id: string) {
  const parsed = idSchema.safeParse({ id });

  if (!parsed.success) {
    return null;
  }

  return getAdminProductById(parsed.data.id);
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession(request);

    if (!session) {
      return NextResponse.json(buildApiError('Unauthorized.', 'UNAUTHORIZED'), { status: 401 });
    }

    const { id } = await context.params;
    const product = await getValidatedProduct(id);

    if (!product) {
      return NextResponse.json(buildApiError('Product not found.', 'NOT_FOUND'), { status: 404 });
    }

    return NextResponse.json(buildApiSuccess(product));
  } catch {
    return NextResponse.json(buildApiError('Unable to load the product.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession(request);

    if (!session) {
      return NextResponse.json(buildApiError('Unauthorized.', 'UNAUTHORIZED'), { status: 401 });
    }

    const { id } = await context.params;
    const existing = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
      },
    });

    if (!existing) {
      return NextResponse.json(buildApiError('Product not found.', 'NOT_FOUND'), { status: 404 });
    }

    const formData = await request.formData();
    const input = buildProductFormInput(formData);
    const slug = await resolveUniqueProductSlug(input.slug || input.name, existing.id);

    const images = buildImageInputs(input.images);

    const updatedProduct = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: existing.id },
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

      await tx.productImage.deleteMany({ where: { productId: existing.id } });

      if (images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((image) => ({
            productId: existing.id,
            url: image.url,
            alt: input.name,
            sortOrder: image.sortOrder,
          })),
        });
      }

      return tx.product.findUnique({
        where: { id: existing.id },
        include: {
          category: true,
          images: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    });

    if (!updatedProduct) {
      return NextResponse.json(buildApiError('Unable to update the product.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
    }

    return NextResponse.json(buildApiSuccess(serializeAdminProduct(updatedProduct)));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(buildApiError('Invalid product data.', 'INVALID_INPUT'), { status: 400 });
    }

    return NextResponse.json(buildApiError('Unable to update the product.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession(request);

    if (!session) {
      return NextResponse.json(buildApiError('Unauthorized.', 'UNAUTHORIZED'), { status: 401 });
    }

    const { id } = await context.params;
    const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });

    if (!existing) {
      return NextResponse.json(buildApiError('Product not found.', 'NOT_FOUND'), { status: 404 });
    }

    await prisma.product.delete({ where: { id: existing.id } });

    return NextResponse.json(buildApiSuccess({ deleted: true }));
  } catch {
    return NextResponse.json(buildApiError('Unable to delete the product.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}
