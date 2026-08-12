import { NextRequest, NextResponse } from 'next/server';
import { ProductStatus } from '@prisma/client';
import { z } from 'zod';

import { buildApiError, buildApiSuccess, parsePaginationParams, parseQueryParam } from '@/lib/api-utils';
import { ADMIN_AUTH_COOKIE, verifyAdminSession } from '@/lib/auth/server';
import {
  buildProductFormInput,
  bulkUpdateProducts,
  createAdminProduct,
  getAdminProductsList,
} from '@/lib/admin-products';

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
    const status = searchParams.get('status') === ProductStatus.DRAFT || searchParams.get('status') === ProductStatus.PUBLISHED ? searchParams.get('status') as ProductStatus : undefined;
    const { page, limit } = parsePaginationParams(searchParams.get('page') ?? undefined, searchParams.get('limit') ?? undefined);

    const data = await getAdminProductsList({ search, categoryId, status, page, limit });

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
    const createdProduct = await createAdminProduct(input);

    if (!createdProduct) {
      return NextResponse.json(buildApiError('Unable to create the product.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
    }

    return NextResponse.json(buildApiSuccess(createdProduct), { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(buildApiError('Invalid product data.', 'INVALID_INPUT'), { status: 400 });
    }

    return NextResponse.json(buildApiError('Unable to create the product.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}

const bulkActionSchema = z.object({
  action: z.enum(['delete', 'publish', 'draft']),
  ids: z.array(z.string().min(1)).min(1),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);

    if (!session) {
      return NextResponse.json(buildApiError('Unauthorized.', 'UNAUTHORIZED'), { status: 401 });
    }

    const parsed = bulkActionSchema.parse(await request.json());
    const count = await bulkUpdateProducts(parsed.ids, parsed.action);

    return NextResponse.json(buildApiSuccess({ count }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(buildApiError('Invalid bulk action.', 'INVALID_INPUT'), { status: 400 });
    }

    return NextResponse.json(buildApiError('Unable to update products.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}
