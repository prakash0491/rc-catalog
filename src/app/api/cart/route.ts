import 'server-only';

import { NextResponse } from 'next/server';

import { buildApiError, buildApiSuccess } from '@/lib/api-utils';
import { getCustomerSession } from '@/lib/auth/customer-session';
import { getOrCreateCustomerCart, getOrCreateGuestCart } from '@/lib/cart';
import { getGuestSessionId } from '@/lib/guest-session';

export async function GET() {
  try {
    const session = await getCustomerSession();

    if (session) {
      const cart = await getOrCreateCustomerCart(session.id);
      return NextResponse.json(buildApiSuccess({ cart }));
    }

    const guestSessionId = await getGuestSessionId();

    if (guestSessionId) {
      const cart = await getOrCreateGuestCart(guestSessionId);
      return NextResponse.json(buildApiSuccess({ cart }));
    }

    return NextResponse.json(buildApiSuccess({ cart: null }));
  } catch (error) {
    console.error('Get cart error:', error);
    return NextResponse.json(buildApiError('Unable to load cart.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}