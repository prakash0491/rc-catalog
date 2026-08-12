import 'server-only';

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { buildApiError, buildApiSuccess } from '@/lib/api-utils';
import { getCustomerSession } from '@/lib/auth/customer-session';
import { verifyCheckoutPayment } from '@/lib/orders';
import { RazorpayConfigError } from '@/lib/razorpay';

const verifySchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await getCustomerSession();

    if (!session) {
      return NextResponse.json(buildApiError('Authentication required.', 'UNAUTHORIZED'), { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        buildApiError(parsed.error.issues[0]?.message ?? 'Invalid input.', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const result = await verifyCheckoutPayment({
      customerId: session.id,
      razorpayOrderId: parsed.data.razorpayOrderId,
      razorpayPaymentId: parsed.data.razorpayPaymentId,
      razorpaySignature: parsed.data.razorpaySignature,
    });

    return NextResponse.json(buildApiSuccess(result));
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'ORDER_NOT_FOUND') {
        return NextResponse.json(buildApiError('Order not found.', 'ORDER_NOT_FOUND'), { status: 404 });
      }

      if (error.message === 'VERIFICATION_FAILED') {
        return NextResponse.json(
          buildApiError('Payment verification failed. Please contact support if you were charged.', 'VERIFICATION_FAILED'),
          { status: 400 }
        );
      }

      if (error.message === 'AMOUNT_MISMATCH') {
        return NextResponse.json(
          buildApiError('Payment amount does not match the order. Please contact support.', 'AMOUNT_MISMATCH'),
          { status: 400 }
        );
      }

      if (error.message === 'STOCK_CONFLICT') {
        return NextResponse.json(
          buildApiError('Your order could not be finalized because stock changed. Please contact support.', 'STOCK_CONFLICT'),
          { status: 409 }
        );
      }

      if (error instanceof RazorpayConfigError) {
        return NextResponse.json(buildApiError(error.message, 'PAYMENT_NOT_CONFIGURED'), { status: 503 });
      }
    }

    console.error('Verify payment error:', error);
    return NextResponse.json(buildApiError('Unable to verify payment. Please try again.', 'INTERNAL_SERVER_ERROR'), {
      status: 500,
    });
  }
}
