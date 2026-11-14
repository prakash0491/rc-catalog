import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

import { buildApiError, buildApiSuccess } from '@/lib/api-utils';
import { GUEST_CART_COOKIE } from '@/lib/auth/customer-constants';
import { createCustomer, findCustomerByEmail } from '@/lib/auth/customer-db';
import { createCustomerSessionCookie } from '@/lib/auth/customer-session';
import type { CustomerSession } from '@/lib/auth/customer-types';
import { mergeGuestCartSafely } from '@/lib/cart';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        buildApiError(parsed.error.issues[0]?.message ?? 'Invalid input.', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const existing = await findCustomerByEmail(email);

    if (existing) {
      return NextResponse.json(
        buildApiError('An account with this email already exists.', 'DUPLICATE_EMAIL'),
        { status: 409 }
      );
    }

    const customer = await createCustomer(name, email, password);

    const session: CustomerSession = {
      id: customer.id,
      email: customer.email,
      name: customer.name,
    };

    const response = NextResponse.json(
      buildApiSuccess({ customer: { id: customer.id, email: customer.email, name: customer.name } }),
      { status: 201 }
    );

    await createCustomerSessionCookie(response, session);

    const guestSessionId = request.cookies.get(GUEST_CART_COOKIE)?.value;

    if (guestSessionId && (await mergeGuestCartSafely(guestSessionId, customer.id))) {
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
    // Two concurrent registrations can pass the lookup above; the unique
    // constraint is the source of truth.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        buildApiError('An account with this email already exists.', 'DUPLICATE_EMAIL'),
        { status: 409 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      buildApiError('Unable to complete registration.', 'INTERNAL_SERVER_ERROR'),
      { status: 500 }
    );
  }
}