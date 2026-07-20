import { NextRequest, NextResponse } from 'next/server';

import { clearAdminSessionCookie, ADMIN_LOGIN_PATH } from '@/lib/auth';

function redirectToLogin(request: NextRequest) {
  const response = NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
  return clearAdminSessionCookie(response);
}

export async function GET(request: NextRequest) {
  return redirectToLogin(request);
}

export async function POST(request: NextRequest) {
  return redirectToLogin(request);
}
