import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { buildApiError, buildApiSuccess } from '@/lib/api-utils';
import { ADMIN_AUTH_COOKIE, verifyAdminSession } from '@/lib/auth';
import { getCategoryForEdit, parseCategoryForm, resolveUniqueCategorySlug } from '@/lib/categories';
import { prisma } from '@/lib/prisma';

async function requireAdminSession(request: NextRequest) {
  const token = request.cookies.get(ADMIN_AUTH_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifyAdminSession(token);
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession(request);

    if (!session) {
      return NextResponse.json(buildApiError('Unauthorized.', 'UNAUTHORIZED'), { status: 401 });
    }

    const { id } = await context.params;
    const category = await getCategoryForEdit(id);

    if (!category) {
      return NextResponse.json(buildApiError('Category not found.', 'NOT_FOUND'), { status: 404 });
    }

    return NextResponse.json(
      buildApiSuccess({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        displayOrder: category.displayOrder,
        isActive: category.isActive,
        productCount: category._count.products,
      })
    );
  } catch {
    return NextResponse.json(buildApiError('Unable to load category.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession(request);

    if (!session) {
      return NextResponse.json(buildApiError('Unauthorized.', 'UNAUTHORIZED'), { status: 401 });
    }

    const { id } = await context.params;
    const existing = await prisma.category.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(buildApiError('Category not found.', 'NOT_FOUND'), { status: 404 });
    }

    const formData = await request.formData();
    const input = parseCategoryForm(formData);
    const slug = await resolveUniqueCategorySlug(input.slug || input.name, existing.id);

    const category = await prisma.category.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        slug,
        description: input.description,
        image: input.image,
        displayOrder: input.displayOrder,
        isActive: input.isActive,
      },
      include: { _count: { select: { products: true } } },
    });

    return NextResponse.json(
      buildApiSuccess({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        displayOrder: category.displayOrder,
        isActive: category.isActive,
        productCount: category._count.products,
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(buildApiError('Invalid category data.', 'INVALID_INPUT'), { status: 400 });
    }

    return NextResponse.json(buildApiError('Unable to update category.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession(request);

    if (!session) {
      return NextResponse.json(buildApiError('Unauthorized.', 'UNAUTHORIZED'), { status: 401 });
    }

    const { id } = await context.params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!category) {
      return NextResponse.json(buildApiError('Category not found.', 'NOT_FOUND'), { status: 404 });
    }

    if (category._count.products > 0) {
      return NextResponse.json(buildApiError('Category cannot be deleted because products exist in it.', 'CATEGORY_HAS_PRODUCTS'), { status: 400 });
    }

    await prisma.category.delete({ where: { id: category.id } });

    return NextResponse.json(buildApiSuccess({ deleted: true }));
  } catch {
    return NextResponse.json(buildApiError('Unable to delete category.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}
