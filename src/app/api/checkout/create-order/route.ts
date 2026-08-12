import 'server-only';

import { NextResponse } from 'next/server';

import { buildApiError, buildApiSuccess } from '@/lib/api-utils';
import { getCustomerSession } from '@/lib/auth/customer-session';
import { createCheckoutOrder } from '@/lib/orders';
import { RazorpayConfigError } from '@/lib/razorpay';

export async function POST() {
  try {
    const session = await getCustomerSession();

    if (!session) {
      return NextResponse.json(buildApiError('Authentication required.', 'UNAUTHORIZED'), { status: 401 });
    }

    const result = await createCheckoutOrder(session.id);

    return NextResponse.json(buildApiSuccess(result));
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'CART_EMPTY') {
        return NextResponse.json(buildApiError('Your cart is empty.', 'CART_EMPTY'), { status: 400 });
      }

      if (error.message === 'ITEM_UNAVAILABLE') {
        return NextResponse.json(
          buildApiError('One or more items in your cart are no longer available. Please review your cart.', 'ITEM_UNAVAILABLE'),
          { status: 409 }
        );
      }

      if (error instanceof RazorpayConfigError) {
        return NextResponse.json(buildApiError(error.message, 'PAYMENT_NOT_CONFIGURED'), { status: 503 });
      }
    }

    console.error('Create checkout order error:', error);
    return NextResponse.json(buildApiError('Unable to start checkout. Please try again.', 'INTERNAL_SERVER_ERROR'), {
      status: 500,
    });
  }
}
