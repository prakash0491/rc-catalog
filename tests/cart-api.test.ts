import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, type NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

const mocks = vi.hoisted(() => ({
  getCustomerSession: vi.fn(),
  getGuestSessionId: vi.fn(),
  getOrCreateGuestSessionId: vi.fn(),
  setGuestSessionCookie: vi.fn(),
  addItemToCart: vi.fn(),
  getOrCreateCustomerCart: vi.fn(),
  getOrCreateGuestCart: vi.fn(),
  updateCartItemQuantity: vi.fn(),
  removeCartItem: vi.fn(),
}));

vi.mock('@/lib/auth/customer-session', () => ({ getCustomerSession: mocks.getCustomerSession }));
vi.mock('@/lib/guest-session', () => ({
  getGuestSessionId: mocks.getGuestSessionId,
  getOrCreateGuestSessionId: mocks.getOrCreateGuestSessionId,
  setGuestSessionCookie: mocks.setGuestSessionCookie,
}));
vi.mock('@/lib/cart', () => ({
  addItemToCart: mocks.addItemToCart,
  getOrCreateCustomerCart: mocks.getOrCreateCustomerCart,
  getOrCreateGuestCart: mocks.getOrCreateGuestCart,
  updateCartItemQuantity: mocks.updateCartItemQuantity,
  removeCartItem: mocks.removeCartItem,
}));

import { DELETE, PATCH } from '@/app/api/cart/items/[id]/route';
import { POST } from '@/app/api/cart/items/route';
import { GET } from '@/app/api/cart/route';
import { GUEST_CART_COOKIE } from '@/lib/auth/customer-constants';

const jsonRequest = (url: string, method: string, body: unknown) =>
  new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

const patchItem = (body: unknown) =>
  PATCH(jsonRequest('http://localhost/api/cart/items/item', 'PATCH', body), {
    params: Promise.resolve({ id: 'item' }),
  });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getCustomerSession.mockResolvedValue({ id: 'customer', email: 'c@example.com', name: 'Customer' });
  mocks.getOrCreateCustomerCart.mockResolvedValue({ id: 'cart', items: [{ id: 'item' }] });
  mocks.getOrCreateGuestCart.mockResolvedValue({ id: 'guest-cart', items: [{ id: 'item' }] });
  mocks.updateCartItemQuantity.mockResolvedValue({ id: 'item', quantity: 2 });
  mocks.addItemToCart.mockResolvedValue({ id: 'new-item' });
  mocks.getOrCreateGuestSessionId.mockResolvedValue({ guestSessionId: 'guest', isNew: true });
  mocks.setGuestSessionCookie.mockImplementation((response: NextResponse) => {
    response.cookies.set(GUEST_CART_COOKIE, 'guest');
    return response;
  });
});

describe('cart loading', () => {
  it('returns numeric prices and the configured currency', async () => {
    mocks.getOrCreateCustomerCart.mockResolvedValue({
      id: 'cart',
      items: [
        {
          id: 'item',
          productId: 'product',
          variantId: null,
          quantity: 2,
          product: {
            id: 'product',
            slug: 'product',
            name: 'Product',
            price: new Prisma.Decimal('19.99'),
            mrp: new Prisma.Decimal('29.99'),
            stockQuantity: 5,
            stockStatus: 'IN_STOCK',
            images: [{ url: '/image.jpg' }],
          },
          variant: null,
        },
      ],
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.currency).toBe('INR');
    expect(payload.data.cart.items[0].product).toMatchObject({ price: 19.99, mrp: 29.99 });
  });

  it('returns a null cart for guests without a session', async () => {
    mocks.getCustomerSession.mockResolvedValue(null);
    mocks.getGuestSessionId.mockResolvedValue(null);

    const response = await GET();
    const payload = await response.json();

    expect(payload.data.cart).toBeNull();
    expect(mocks.getOrCreateGuestCart).not.toHaveBeenCalled();
  });
});

describe('cart item updates', () => {
  it.each([1.5, 1e20, -1])('rejects invalid quantity %s before touching the cart', async (quantity) => {
    const response = await patchItem({ quantity });
    expect(response.status).toBe(400);
    expect(mocks.updateCartItemQuantity).not.toHaveBeenCalled();
  });

  it('returns 409 when the requested quantity exceeds stock', async () => {
    mocks.updateCartItemQuantity.mockRejectedValue(new Error('INSUFFICIENT_STOCK'));
    const response = await patchItem({ quantity: 50 });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ success: false, error: { code: 'INSUFFICIENT_STOCK' } });
  });

  it('returns 404 for another cart item', async () => {
    mocks.getOrCreateCustomerCart.mockResolvedValue({ id: 'cart', items: [] });
    const response = await patchItem({ quantity: 2 });
    expect(response.status).toBe(404);
    expect(mocks.updateCartItemQuantity).not.toHaveBeenCalled();
  });

  it('updates an owned item', async () => {
    const response = await patchItem({ quantity: 2 });
    expect(response.status).toBe(200);
    expect(mocks.updateCartItemQuantity).toHaveBeenCalledWith('item', 'cart', 2);
    expect(await response.json()).toMatchObject({ success: true, data: { item: { id: 'item', quantity: 2 } } });
  });

  it('removes an owned item', async () => {
    const response = await DELETE(new NextRequest('http://localhost/api/cart/items/item', { method: 'DELETE' }), {
      params: Promise.resolve({ id: 'item' }),
    });
    expect(response.status).toBe(200);
    expect(mocks.removeCartItem).toHaveBeenCalledWith('item', 'cart');
  });

  it('does not create a cart just to edit an unknown guest session', async () => {
    mocks.getCustomerSession.mockResolvedValue(null);
    mocks.getGuestSessionId.mockResolvedValue(null);
    const response = await patchItem({ quantity: 2 });
    expect(response.status).toBe(404);
    expect(mocks.getOrCreateGuestCart).not.toHaveBeenCalled();
  });
});

describe('adding cart items', () => {
  it.each([0, 1.5, 1e20])('rejects invalid quantity %s', async (quantity) => {
    const response = await POST(jsonRequest('http://localhost/api/cart/items', 'POST', { productId: 'product', quantity }));
    expect(response.status).toBe(400);
    expect(mocks.addItemToCart).not.toHaveBeenCalled();
  });

  it('maps stock conflicts to 409', async () => {
    mocks.addItemToCart.mockRejectedValue(new Error('INSUFFICIENT_STOCK'));
    const response = await POST(jsonRequest('http://localhost/api/cart/items', 'POST', { productId: 'product' }));
    expect(response.status).toBe(409);
  });

  it('issues a guest cookie on first guest addition', async () => {
    mocks.getCustomerSession.mockResolvedValue(null);
    mocks.getGuestSessionId.mockResolvedValue(null);
    const response = await POST(jsonRequest('http://localhost/api/cart/items', 'POST', { productId: 'product' }));
    expect(response.status).toBe(201);
    expect(response.cookies.get(GUEST_CART_COOKIE)?.value).toBe('guest');
    expect(mocks.addItemToCart).toHaveBeenCalledWith('guest-cart', 'product', null, 1);
  });

  it('does not change the guest cookie for a signed-in customer', async () => {
    const response = await POST(jsonRequest('http://localhost/api/cart/items', 'POST', { productId: 'product' }));
    expect(response.status).toBe(201);
    expect(mocks.getOrCreateGuestSessionId).not.toHaveBeenCalled();
    expect(response.cookies.get(GUEST_CART_COOKIE)).toBeUndefined();
  });
});
