/// <reference types="vite/client" />
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const db = vi.hoisted(() => ({
  product: { findMany: vi.fn() },
  cart: { findUnique: vi.fn() },
}));
vi.mock('@/lib/prisma', () => ({ prisma: db }));
vi.mock('@/lib/auth/customer-session', () => ({ getCustomerSession: vi.fn().mockResolvedValue(null) }));
vi.mock('@/lib/guest-session', () => ({ getGuestSessionId: vi.fn().mockResolvedValue(null) }));

// Load the actual route modules; only external persistence/session boundaries
// are mocked. Every exported admin method must reject missing credentials.
const adminRoutes = import.meta.glob('../src/app/api/admin/**/route.ts');
const allRoutes = import.meta.glob('../src/app/api/**/route.ts');
type Handler = (request: NextRequest, context: { params: Promise<{ id: string }> }) => Promise<Response>;
beforeEach(() => vi.clearAllMocks());
describe('admin API access control', () => {
  for (const [path, load] of Object.entries(adminRoutes)) {
    it(`blocks unauthenticated access to ${path}`, async () => {
      const route = await load() as Record<string, Handler>;
      for (const [method, handler] of Object.entries(route)) {
        if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) continue;
        const response = await handler(new NextRequest('http://localhost/api/admin/test', { method }), { params: Promise.resolve({ id: 'test' }) });
        expect(response.status, method).toBe(401);
        expect(await response.json()).toMatchObject({ success: false, error: { code: 'UNAUTHORIZED' } });
      }
    });
  }
});
describe('customer API access control', () => {
  it.each([
    ['orders', 'GET'], ['orders/[id]', 'GET'], ['checkout/create-order', 'POST'],
    ['checkout/verify-payment', 'POST'], ['wishlist', 'GET'], ['wishlist', 'POST'],
    ['wishlist/[productId]', 'DELETE'],
  ])('blocks unauthenticated %s %s', async (path, method) => {
    const route = await allRoutes[`../src/app/api/${path}/route.ts`]() as Record<string, Handler>;
    const response = await route[method](new NextRequest(`http://localhost/api/${path}`, { method }), { params: Promise.resolve({ id: 'test', productId: 'product' }) });
    expect(response.status).toBe(401);
  });
});
