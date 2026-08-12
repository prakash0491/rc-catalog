import 'server-only';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { CUSTOMER_AUTH_COOKIE } from './customer-constants';
import { signCustomerSession, verifyCustomerSession } from './customer-jwt';
import type { CustomerSession } from './customer-types';

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_AUTH_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifyCustomerSession(token);
}

export async function getCustomerSessionFromCookieStore(cookieStore: { get: (name: string) => { value: string } | undefined }) {
  const token = cookieStore.get(CUSTOMER_AUTH_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifyCustomerSession(token);
}

export function setCustomerSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(CUSTOMER_AUTH_COOKIE, token, getCookieOptions());
  return response;
}

export function clearCustomerSessionCookie(response: NextResponse) {
  response.cookies.set(CUSTOMER_AUTH_COOKIE, '', {
    ...getCookieOptions(),
    maxAge: 0,
  });
  return response;
}

export async function createCustomerSessionCookie(response: NextResponse, session: CustomerSession) {
  const token = await signCustomerSession(session);
  return setCustomerSessionCookie(response, token);
}