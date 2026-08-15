import 'server-only';

import { NextRequest, NextResponse } from 'next/server';

import { clearCustomerSessionCookie } from '@/lib/auth/customer-session';

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/', request.url), 303);

  return clearCustomerSessionCookie(response);
}
