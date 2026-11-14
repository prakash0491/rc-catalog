import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SignJWT } from 'jose';
import { signAdminSession, verifyAdminSession } from '@/lib/auth/jwt';
import { signCustomerSession, verifyCustomerSession } from '@/lib/auth/customer-jwt';

const session = { id: 'user', email: 'user@example.com', name: 'User' };
beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('ADMIN_JWT_SECRET', 'admin-test-secret-long-enough');
  vi.stubEnv('CUSTOMER_JWT_SECRET', 'customer-test-secret-long-enough');
  vi.stubEnv('AUTH_SECRET', undefined);
  vi.stubEnv('NEXTAUTH_SECRET', undefined);
});
afterEach(() => vi.unstubAllEnvs());

describe('session authentication', () => {
  it('round-trips admin sessions', async () => {
    expect(await verifyAdminSession(await signAdminSession(session))).toEqual(session);
  });
  it('round-trips customer sessions', async () => {
    expect(await verifyCustomerSession(await signCustomerSession(session))).toEqual(session);
  });
  it('rejects malformed tokens', async () => {
    expect(await verifyCustomerSession('not.a.token')).toBeNull();
    expect(await verifyAdminSession('not.a.token')).toBeNull();
  });
  it('rejects expired tokens', async () => {
    const token = await new SignJWT({ email: session.email }).setProtectedHeader({ alg: 'HS256' }).setSubject('user').setExpirationTime(0).sign(new TextEncoder().encode('admin-test-secret-long-enough'));
    expect(await verifyAdminSession(token)).toBeNull();
  });
  it('fails closed without a production secret', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_JWT_SECRET', undefined);
    vi.stubEnv('CUSTOMER_JWT_SECRET', undefined);
    await expect(signAdminSession(session)).rejects.toThrow('must be configured');
    await expect(signCustomerSession(session)).rejects.toThrow('must be configured');
  });
  it('rejects empty production secrets', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_JWT_SECRET', '');
    await expect(signAdminSession(session)).rejects.toThrow('must be configured');
  });
  it('separates admin and customer tokens even when AUTH_SECRET is shared', async () => {
    vi.stubEnv('ADMIN_JWT_SECRET', undefined);
    vi.stubEnv('CUSTOMER_JWT_SECRET', undefined);
    vi.stubEnv('AUTH_SECRET', 'a-shared-secret-for-tests-only');
    expect(await verifyAdminSession(await signCustomerSession(session))).toBeNull();
    expect(await verifyCustomerSession(await signAdminSession(session))).toBeNull();
  });
});
