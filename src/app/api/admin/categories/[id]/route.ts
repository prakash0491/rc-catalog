import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { buildApiError, buildApiSuccess, formatZodErrorMessage } from '@/lib/api-utils';
import { ADMIN_AUTH_COOKIE, verifyAdminSession } from '@/lib/auth/server';
import { getCategoryForEdit, parseCategoryForm, resolveUniqueCategorySlug, serializeCategoryForApi } from '@/lib/categories';
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

    return NextResponse.json(buildApiSuccess(serializeCategoryForApi(category)));
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

    await prisma.category.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        slug,
        description: input.description,
        image: input.image,
        displayOrder: input.displayOrder,
        isActive: input.isActive,
      },
    });

    const updated = await getCategoryForEdit(existing.id);

    if (!updated) {
      return NextResponse.json(buildApiError('Category not found.', 'NOT_FOUND'), { status: 404 });
    }

    return NextResponse.json(buildApiSuccess(serializeCategoryForApi(updated)));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(buildApiError(formatZodErrorMessage(error), 'INVALID_INPUT'), { status: 400 });
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

    // Delete protection counts every attached product (including drafts and
    // soft-deleted records) because they all hold a foreign key reference to
    // this category and would block the delete at the database level.
    if (category._count.products > 0) {
      return NextResponse.json(buildApiError('Category cannot be deleted because products exist in it.', 'CATEGORY_HAS_PRODUCTS'), { status: 400 });
    }

    await prisma.category.delete({ where: { id: category.id } });

    return NextResponse.json(buildApiSuccess({ deleted: true }));
  } catch {
    return NextResponse.json(buildApiError('Unable to delete category.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}
