import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';

const mocks = vi.hoisted(() => ({
  findCustomerByEmail: vi.fn(),
  createCustomer: vi.fn(),
  authenticateCustomer: vi.fn(),
  createCustomerSessionCookie: vi.fn(),
  mergeGuestCartSafely: vi.fn(),
}));

vi.mock('@/lib/auth/customer-db', () => ({
  findCustomerByEmail: mocks.findCustomerByEmail,
  createCustomer: mocks.createCustomer,
  authenticateCustomer: mocks.authenticateCustomer,
}));
vi.mock('@/lib/auth/customer-session', () => ({
  createCustomerSessionCookie: mocks.createCustomerSessionCookie,
}));
vi.mock('@/lib/cart', () => ({ mergeGuestCartSafely: mocks.mergeGuestCartSafely }));

import { POST as login } from '@/app/api/auth/login/route';
import { POST as register } from '@/app/api/auth/register/route';
import { CUSTOMER_AUTH_COOKIE, GUEST_CART_COOKIE } from '@/lib/auth/customer-constants';

function authRequest(path: 'login' | 'register', body: unknown, cookie?: string) {
  return new NextRequest(`http://localhost/api/auth/${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

const credentials = { email: 'customer@example.com', password: 'correct-password' };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.createCustomerSessionCookie.mockImplementation((response: { cookies: { set: (name: string, value: string) => void } }) => {
    response.cookies.set(CUSTOMER_AUTH_COOKIE, 'signed-session');
  });
  mocks.mergeGuestCartSafely.mockResolvedValue(true);
  mocks.findCustomerByEmail.mockResolvedValue(null);
  mocks.createCustomer.mockResolvedValue({ id: 'customer', email: credentials.email, name: 'Customer' });
});

describe('customer login', () => {
  it('rejects malformed input with a field message', async () => {
    const response = await login(authRequest('login', { email: 'not-an-email', password: '' }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR' } });
    expect(mocks.authenticateCustomer).not.toHaveBeenCalled();
  });

  it('rejects incorrect credentials without revealing which field failed', async () => {
    mocks.authenticateCustomer.mockResolvedValue(null);
    const response = await login(authRequest('login', credentials));
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ success: false, error: { code: 'INVALID_CREDENTIALS' } });
  });

  it('signs the customer in', async () => {
    mocks.authenticateCustomer.mockResolvedValue({ id: 'customer', email: credentials.email, name: 'Customer' });
    const response = await login(authRequest('login', credentials));
    expect(response.status).toBe(200);
    expect(response.cookies.get(CUSTOMER_AUTH_COOKIE)?.value).toBe('signed-session');
    expect(mocks.authenticateCustomer).toHaveBeenCalledWith(credentials.email, credentials.password);
  });

  it('clears the guest cookie after merging the guest cart', async () => {
    mocks.authenticateCustomer.mockResolvedValue({ id: 'customer', email: credentials.email, name: 'Customer' });
    mocks.mergeGuestCartSafely.mockResolvedValue(true);
    const response = await login(authRequest('login', credentials, `${GUEST_CART_COOKIE}=guest`));
    expect(response.status).toBe(200);
    expect(mocks.mergeGuestCartSafely).toHaveBeenCalledWith('guest', 'customer');
    expect(response.cookies.get(GUEST_CART_COOKIE)?.value).toBe('');
  });

  it('still signs in when the cart merge fails', async () => {
    mocks.authenticateCustomer.mockResolvedValue({ id: 'customer', email: credentials.email, name: 'Customer' });
    mocks.mergeGuestCartSafely.mockResolvedValue(false);
    const response = await login(authRequest('login', credentials, `${GUEST_CART_COOKIE}=guest`));
    expect(response.status).toBe(200);
    expect(response.cookies.get(CUSTOMER_AUTH_COOKIE)?.value).toBe('signed-session');
    // The guest cookie is retained so the cart is not lost.
    expect(response.cookies.get(GUEST_CART_COOKIE)).toBeUndefined();
  });
});

describe('customer registration', () => {
  it('rejects short passwords', async () => {
    const response = await register(authRequest('register', { name: 'Customer', email: credentials.email, password: 'short' }));
    expect(response.status).toBe(400);
    expect(mocks.createCustomer).not.toHaveBeenCalled();
  });

  it('reports duplicate accounts', async () => {
    mocks.findCustomerByEmail.mockResolvedValue({ id: 'existing' });
    const response = await register(authRequest('register', { name: 'Customer', ...credentials }));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: 'DUPLICATE_EMAIL' } });
  });

  it('handles a concurrent duplicate registration', async () => {
    mocks.createCustomer.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.19.3',
      })
    );
    const response = await register(authRequest('register', { name: 'Customer', ...credentials }));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: 'DUPLICATE_EMAIL' } });
  });

  it('creates the account and session', async () => {
    const response = await register(authRequest('register', { name: 'Customer', ...credentials }));
    expect(response.status).toBe(201);
    expect(response.cookies.get(CUSTOMER_AUTH_COOKIE)?.value).toBe('signed-session');
    expect(mocks.createCustomer).toHaveBeenCalledWith('Customer', credentials.email, credentials.password);
  });

  it('does not fail registration when the guest cart cannot be merged', async () => {
    mocks.mergeGuestCartSafely.mockResolvedValue(false);
    const response = await register(authRequest('register', { name: 'Customer', ...credentials }, `${GUEST_CART_COOKIE}=guest`));
    expect(response.status).toBe(201);
    expect(response.cookies.get(CUSTOMER_AUTH_COOKIE)?.value).toBe('signed-session');
  });
});
