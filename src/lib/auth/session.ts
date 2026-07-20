import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { ADMIN_AUTH_COOKIE, ADMIN_HOME_PATH } from './constants';
import { signAdminSession, verifyAdminSession } from './jwt';
import type { AdminSession } from './types';

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function getSafeAdminRedirectPath(nextPath?: string | null) {
  if (!nextPath || (nextPath !== '/admin' && !nextPath.startsWith('/admin/'))) {
    return ADMIN_HOME_PATH;
  }

  return nextPath;
}

export function getAdminTokenFromCookieStore(cookieStore: { get: (name: string) => { value: string } | undefined }) {
  return cookieStore.get(ADMIN_AUTH_COOKIE)?.value ?? null;
}

export async function getAdminSessionFromCookieStore(cookieStore?: Awaited<ReturnType<typeof cookies>>) {
  const resolvedCookieStore = cookieStore ?? await cookies();
  const token = getAdminTokenFromCookieStore(resolvedCookieStore);

  if (!token) {
    return null;
  }

  return verifyAdminSession(token);
}

export async function getAdminSessionFromToken(token?: string | null) {
  if (!token) {
    return null;
  }

  return verifyAdminSession(token);
}

export function setAdminSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_AUTH_COOKIE, token, getCookieOptions());
  return response;
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_AUTH_COOKIE, '', {
    ...getCookieOptions(),
    maxAge: 0,
  });
  return response;
}

export async function createAdminSessionCookie(response: NextResponse, session: AdminSession) {
  const token = await signAdminSession(session);
  return setAdminSessionCookie(response, token);
}
