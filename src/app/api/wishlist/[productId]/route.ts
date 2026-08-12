import 'server-only';

import { NextResponse } from 'next/server';

import { buildApiError, buildApiSuccess } from '@/lib/api-utils';
import { getCustomerSession } from '@/lib/auth/customer-session';
import { removeProductFromWishlist } from '@/lib/wishlist';

export async function DELETE(_request: Request, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const session = await getCustomerSession();

    if (!session) {
      return NextResponse.json(buildApiError('Authentication required.', 'UNAUTHORIZED'), { status: 401 });
    }

    const { productId } = await params;

    if (!productId) {
      return NextResponse.json(buildApiError('Product ID is required.', 'VALIDATION_ERROR'), { status: 400 });
    }

    await removeProductFromWishlist(session.id, productId);
    return NextResponse.json(buildApiSuccess({ removed: true }));
  } catch {
    console.error('Remove wishlist error:');
    return NextResponse.json(buildApiError('Unable to remove from wishlist.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}