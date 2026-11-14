import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { buildApiError, buildApiSuccess } from '@/lib/api-utils';
import { GUEST_CART_COOKIE } from '@/lib/auth/customer-constants';
import { authenticateCustomer } from '@/lib/auth/customer-db';
import { createCustomerSessionCookie } from '@/lib/auth/customer-session';
import { mergeGuestCartSafely } from '@/lib/cart';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        buildApiError(parsed.error.issues[0]?.message ?? 'Invalid input.', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const session = await authenticateCustomer(email, password);

    if (!session) {
      return NextResponse.json(
        buildApiError('Invalid email or password.', 'INVALID_CREDENTIALS'),
        { status: 401 }
      );
    }

    const response = NextResponse.json(
      buildApiSuccess({ customer: { id: session.id, email: session.email, name: session.name } })
    );

    await createCustomerSessionCookie(response, session);

    const guestSessionId = request.cookies.get(GUEST_CART_COOKIE)?.value;

    if (guestSessionId && (await mergeGuestCartSafely(guestSessionId, session.id))) {
      response.cookies.set(GUEST_CART_COOKIE, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 0,
      });
    }

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      buildApiError('Unable to process login.', 'INTERNAL_SERVER_ERROR'),
      { status: 500 }
    );
  }
}