import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_AUTH_COOKIE, ADMIN_LOGIN_PATH, verifyAdminSession } from '@/lib/auth/edge';
import { CUSTOMER_AUTH_COOKIE, CUSTOMER_LOGIN_PATH, verifyCustomerSession } from '@/lib/auth/customer-edge';

const PUBLIC_ADMIN_PATHS = [ADMIN_LOGIN_PATH, '/admin/api/login', '/admin/api/logout'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (/^\/api\/(auth|wishlist|orders)(?:\/|$)/.test(pathname)) {
    return new NextResponse(null, { status: 410 });
  }
  if (pathname.startsWith('/api/cart')) {
    const headers = new Headers(request.headers);
    request.cookies.delete(CUSTOMER_AUTH_COOKIE);
    headers.set('cookie', request.cookies.toString());
    return NextResponse.next({ request: { headers } });
  }

  // ── Admin route protection ──
  if (pathname.startsWith('/admin')) {
    if (PUBLIC_ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
      return NextResponse.next();
    }

    const token = request.cookies.get(ADMIN_AUTH_COOKIE)?.value;
    const session = token ? await verifyAdminSession(token) : null;

    if (!session) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = ADMIN_LOGIN_PATH;
      loginUrl.search = '';
      loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);

      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // ── Customer account / checkout route protection ──
  if (pathname.startsWith('/account')) {
    const token = request.cookies.get(CUSTOMER_AUTH_COOKIE)?.value;
    const session = token ? await verifyCustomerSession(token) : null;

    if (!session) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = CUSTOMER_LOGIN_PATH;
      loginUrl.search = '';
      loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);

      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/api/auth/:path*', '/api/wishlist/:path*', '/api/orders/:path*', '/api/cart/:path*'],
};
