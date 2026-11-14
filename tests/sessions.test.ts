import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
const cookieStore = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));
import { createAdminSessionCookie, clearAdminSessionCookie, getAdminSessionFromCookieStore } from '@/lib/auth/session';
import { createCustomerSessionCookie, clearCustomerSessionCookie, getCustomerSession } from '@/lib/auth/customer-session';
import { getOrCreateGuestSessionId, setGuestSessionCookie } from '@/lib/guest-session';
import { hashAdminPassword, verifyAdminPassword } from '@/lib/auth/password';
import { hashCustomerPassword, verifyCustomerPassword } from '@/lib/auth/customer-password';
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('ADMIN_JWT_SECRET', 'admin-tests-secret');
  vi.stubEnv('CUSTOMER_JWT_SECRET', 'customer-tests-secret');
});
afterEach(() => vi.unstubAllEnvs());
describe('session cookies', () => {
  it.each([createAdminSessionCookie, createCustomerSessionCookie])('sets secure HttpOnly production cookies', async (create) => {
    const response = NextResponse.json({ success: true });
    await create(response, { id: 'user', email: 'test@example.com', name: 'Test' });
    expect(response.cookies.getAll()[0]).toMatchObject({ httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
  });
  it.each([clearAdminSessionCookie, clearCustomerSessionCookie])('expires the cookie at logout', (clear) => {
    const response = clear(NextResponse.json({ success: true }));
    expect(response.cookies.getAll()[0]).toMatchObject({ value: '', maxAge: 0, path: '/' });
  });
  it('returns null when credentials are absent', async () => {
    expect(await getAdminSessionFromCookieStore()).toBeNull();
    expect(await getCustomerSession()).toBeNull();
  });
  it('reuses existing guest sessions', async () => {
    cookieStore.get.mockReturnValue({ value: 'guest-id' });
    expect(await getOrCreateGuestSessionId()).toEqual({ guestSessionId: 'guest-id', isNew: false });
  });
  it('creates opaque guest IDs and secure cookies', async () => {
    const session = await getOrCreateGuestSessionId();
    expect(session.guestSessionId).toMatch(/^[a-f0-9-]{36}$/);
    const response = setGuestSessionCookie(NextResponse.json({}), session.guestSessionId);
    expect(response.cookies.getAll()[0]).toMatchObject({ httpOnly: true, secure: true, maxAge: 2592000 });
  });
});
describe('real bcrypt password hashing', () => {
  it.each([[hashAdminPassword, verifyAdminPassword], [hashCustomerPassword, verifyCustomerPassword]])('never stores plaintext and rejects incorrect passwords', async (hash, verify) => {
    const encoded = await hash('correct-password');
    expect(encoded).not.toContain('correct-password');
    expect(await verify('correct-password', encoded)).toBe(true);
    expect(await verify('wrong-password', encoded)).toBe(false);
  });
});
