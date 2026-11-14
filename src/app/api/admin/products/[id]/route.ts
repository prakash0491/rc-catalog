import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { buildApiError, buildApiSuccess, formatZodErrorMessage } from '@/lib/api-utils';
import { ADMIN_AUTH_COOKIE, verifyAdminSession } from '@/lib/auth/server';
import {
  buildProductFormInput,
  duplicateAdminProduct,
  getAdminProductById,
  softDeleteAdminProduct,
  updateAdminProduct,
} from '@/lib/admin-products';

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
    const formData = await request.formData();
    const input = buildProductFormInput(formData);
    const updatedProduct = await updateAdminProduct(id, input);

    if (!updatedProduct) {
      return NextResponse.json(buildApiError('Unable to update the product.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
    }

    return NextResponse.json(buildApiSuccess(updatedProduct));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(buildApiError(formatZodErrorMessage(error), 'INVALID_INPUT'), { status: 400 });
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
    const deleted = await softDeleteAdminProduct(id);

    if (!deleted) {
      return NextResponse.json(buildApiError('Product not found.', 'NOT_FOUND'), { status: 404 });
    }

    return NextResponse.json(buildApiSuccess({ deleted: true }));
  } catch {
    return NextResponse.json(buildApiError('Unable to delete the product.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession(request);

    if (!session) {
      return NextResponse.json(buildApiError('Unauthorized.', 'UNAUTHORIZED'), { status: 401 });
    }

    const { id } = await context.params;
    const duplicatedProduct = await duplicateAdminProduct(id);

    if (!duplicatedProduct) {
      return NextResponse.json(buildApiError('Product not found.', 'NOT_FOUND'), { status: 404 });
    }

    return NextResponse.json(buildApiSuccess(duplicatedProduct), { status: 201 });
  } catch {
    return NextResponse.json(buildApiError('Unable to duplicate the product.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}
