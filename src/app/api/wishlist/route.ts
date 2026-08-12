import 'server-only';

import { NextResponse } from 'next/server';

import { buildApiError, buildApiSuccess } from '@/lib/api-utils';
import { getCustomerSession } from '@/lib/auth/customer-session';
import { addProductToWishlist, getWishlistForCustomer } from '@/lib/wishlist';

export async function GET() {
  try {
    const session = await getCustomerSession();

    if (!session) {
      return NextResponse.json(buildApiError('Authentication required.', 'UNAUTHORIZED'), { status: 401 });
    }

    const items = await getWishlistForCustomer(session.id);
    return NextResponse.json(buildApiSuccess({ items }));
  } catch (error) {
    console.error('Get wishlist error:', error);
    return NextResponse.json(buildApiError('Unable to load wishlist.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCustomerSession();

    if (!session) {
      return NextResponse.json(buildApiError('Authentication required.', 'UNAUTHORIZED'), { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { productId } = body;

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json(buildApiError('Product ID is required.', 'VALIDATION_ERROR'), { status: 400 });
    }

    const result = await addProductToWishlist(session.id, productId);
    return NextResponse.json(buildApiSuccess({ wishlisted: true, item: result }), { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'PRODUCT_NOT_FOUND') {
      return NextResponse.json(buildApiError('Product not found or unavailable.', 'PRODUCT_NOT_FOUND'), { status: 404 });
    }

    console.error('Add wishlist error:', error);
    return NextResponse.json(buildApiError('Unable to add to wishlist.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}

