import 'server-only';

import { NextResponse } from 'next/server';

import { buildApiError, buildApiSuccess } from '@/lib/api-utils';
import { getGuestSessionId } from '@/lib/guest-session';
import { createCheckoutOrder } from '@/lib/orders';
import { RazorpayConfigError } from '@/lib/razorpay';

import { z } from 'zod';
import { configuredDeliveryFee } from '@/lib/configured-delivery';

const destination = z.object({
  recipientName: z.string().trim().min(2).max(120),
  mobile: z.string().regex(/^[6-9][0-9]{9}$/),
  address: z.string().trim().min(10).max(600),
  pinCode: z.string().regex(/^[1-9][0-9]{5}$/),
});

export async function POST(request: Request) {
  try {
    const session = await getGuestSessionId();

    if (!session) {
      return NextResponse.json(buildApiError('Authentication required.', 'UNAUTHORIZED'), { status: 401 });
    }

    const parsed = destination.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json(buildApiError('Check your delivery details.', 'INVALID_ADDRESS'), { status: 400 });
    const fee = await configuredDeliveryFee(parsed.data.pinCode);
    if (fee === null) return NextResponse.json(buildApiError('Delivery unavailable for this PIN code.', 'UNSUPPORTED_PIN'), { status: 422 });
    const result = await createCheckoutOrder(session, { ...parsed.data, deliveryFee: fee / 100 });

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
