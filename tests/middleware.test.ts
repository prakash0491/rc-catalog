import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { signAdminSession } from '@/lib/auth/jwt';
import { signCustomerSession } from '@/lib/auth/customer-jwt';
import { ADMIN_AUTH_COOKIE } from '@/lib/auth/constants';
import { CUSTOMER_AUTH_COOKIE } from '@/lib/auth/customer-constants';
beforeEach(() => {
  vi.stubEnv('ADMIN_JWT_SECRET', 'admin-secret-for-tests');
  vi.stubEnv('CUSTOMER_JWT_SECRET', 'customer-secret-for-tests');
});
afterEach(() => vi.unstubAllEnvs());
describe('page access control', () => {
  it.each(['/api/auth/login', '/api/wishlist', '/api/orders/example'])('disables the legacy customer API at %s', async (path) => {
    expect((await middleware(new NextRequest(`http://localhost${path}`))).status).toBe(410);
  });
  it.each(['/admin/login', '/admin/api/login', '/admin/api/logout', '/products', '/checkout'])('allows public page %s', async (path) => {
    expect((await middleware(new NextRequest(`http://localhost${path}`))).status).toBe(200);
  });
  it.each(['/admin/products', '/account/orders'])('redirects protected page %s', async (path) => {
    const response = await middleware(new NextRequest(`http://localhost${path}?test=1`));
    expect(response.status).toBe(307);
    const target = new URL(response.headers.get('location')!);
    expect(target.searchParams.get('next')).toBe(`${path}?test=1`);
  });
  it('allows an authenticated admin', async () => {
    const token = await signAdminSession({ id: 'admin', email: 'admin@example.com', name: 'Admin' });
    expect((await middleware(new NextRequest('http://localhost/admin/products', { headers: { cookie: `${ADMIN_AUTH_COOKIE}=${token}` } }))).status).toBe(200);
  });
  it('allows an authenticated customer', async () => {
    const token = await signCustomerSession({ id: 'customer', email: 'customer@example.com', name: 'Customer' });
    expect((await middleware(new NextRequest('http://localhost/checkout', { headers: { cookie: `${CUSTOMER_AUTH_COOKIE}=${token}` } }))).status).toBe(200);
  });
  it('does not accept a customer session as an admin session', async () => {
    const token = await signCustomerSession({ id: 'customer', email: 'customer@example.com', name: 'Customer' });
    expect((await middleware(new NextRequest('http://localhost/admin', { headers: { cookie: `${ADMIN_AUTH_COOKIE}=${token}` } }))).status).toBe(307);
  });
});
