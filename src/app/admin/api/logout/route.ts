import { NextRequest, NextResponse } from 'next/server';

import { clearAdminSessionCookie } from '@/lib/auth/server';

function redirectToHome(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/', request.url), 303);
  return clearAdminSessionCookie(response);
}

export async function GET(request: NextRequest) {
  return redirectToHome(request);
}

export async function POST(request: NextRequest) {
  return redirectToHome(request);
}
