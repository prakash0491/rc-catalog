import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { GUEST_CART_COOKIE } from '@/lib/auth/customer-constants';

export async function getGuestSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(GUEST_CART_COOKIE)?.value;
  return existing ?? null;
}

export function setGuestSessionCookie(response: NextResponse, sessionId: string) {
  response.cookies.set(GUEST_CART_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return response;
}

export async function getOrCreateGuestSessionId(): Promise<{ guestSessionId: string; isNew: boolean }> {
  const existing = await getGuestSessionId();

  if (existing) {
    return { guestSessionId: existing, isNew: false };
  }

  return { guestSessionId: crypto.randomUUID(), isNew: true };
}