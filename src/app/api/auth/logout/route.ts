import 'server-only';

import { NextResponse } from 'next/server';

import { CUSTOMER_AUTH_COOKIE } from '@/lib/auth/customer-constants';

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set(CUSTOMER_AUTH_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  });

  return response;
}