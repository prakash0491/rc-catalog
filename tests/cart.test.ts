import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

const db = vi.hoisted(() => ({
  product: { findFirst: vi.fn() },
  productVariant: { findFirst: vi.fn() },
  cartItem: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({ prisma: db }));
import { addItemToCart, removeCartItem, updateCartItemQuantity } from '@/lib/cart';

beforeEach(() => {
  vi.resetAllMocks();
  db.$transaction.mockImplementation((callback) => callback(db));
  db.product.findFirst.mockResolvedValue({ stockQuantity: 5 });
  db.productVariant.findFirst.mockResolvedValue({ stockQuantity: 3 });
  db.cartItem.findFirst.mockResolvedValue(null);
});

describe('cart additions', () => {
  it('keeps unvarianted items separate from variant items', async () => {
    await addItemToCart('cart', 'product', null, 1);
    expect(db.cartItem.findFirst).toHaveBeenCalledWith({ where: { cartId: 'cart', productId: 'product', variantId: null } });
  });
  it('rejects unpublished or missing products', async () => {
    db.product.findFirst.mockResolvedValue(null);
    await expect(addItemToCart('c', 'p', null, 1)).rejects.toThrow('PRODUCT_NOT_FOUND');
  });
  it('only allows products in active categories', async () => {
    await addItemToCart('cart', 'product', null, 1);
    expect(db.product.findFirst).toHaveBeenCalledWith({
      where: { id: 'product', isActive: true, status: 'PUBLISHED', deletedAt: null, category: { isActive: true } },
    });
  });
  it('rechecks combined stock after a concurrent add changes the cart', async () => {
    db.$transaction.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('Write conflict', {
      code: 'P2034', clientVersion: 'test',
    }));
    db.cartItem.findFirst.mockResolvedValue({ id: 'line', quantity: 4 });

    await expect(addItemToCart('cart', 'product', null, 2)).rejects.toThrow('INSUFFICIENT_STOCK');
    expect(db.$transaction).toHaveBeenCalledTimes(2);
    expect(db.$transaction).toHaveBeenLastCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
    expect(db.cartItem.create).not.toHaveBeenCalled();
    expect(db.cartItem.update).not.toHaveBeenCalled();
  });
  it.each([0, -1, 1.5, NaN, Infinity])('rejects invalid quantity %s', async (quantity) => {
    await expect(addItemToCart('c', 'p', null, quantity)).rejects.toThrow('INVALID_QUANTITY');
  });
  it('rejects missing variants', async () => {
    db.productVariant.findFirst.mockResolvedValue(null);
    await expect(addItemToCart('c', 'p', 'v', 1)).rejects.toThrow('VARIANT_NOT_FOUND');
  });
  it('checks combined quantity', async () => {
    db.cartItem.findFirst.mockResolvedValue({ id: 'item', quantity: 4 });
    await expect(addItemToCart('c', 'p', null, 2)).rejects.toThrow('INSUFFICIENT_STOCK');
    expect(db.cartItem.update).not.toHaveBeenCalled();
  });
  it('checks variant stock instead of product stock', async () => {
    await expect(addItemToCart('c', 'p', 'v', 4)).rejects.toThrow('INSUFFICIENT_STOCK');
  });
  it('allows adding exactly the available quantity', async () => {
    await addItemToCart('c', 'p', null, 5);
    expect(db.cartItem.create).toHaveBeenCalledWith(expect.objectContaining({ data: { cartId: 'c', productId: 'p', variantId: null, quantity: 5 } }));
  });
});

describe('cart updates and removal', () => {
  beforeEach(() => db.cartItem.findFirst.mockResolvedValue({ id: 'i', product: { stockQuantity: 5 }, variant: null }));
  it('checks stock on update', async () => {
    await expect(updateCartItemQuantity('i', 'c', 6)).rejects.toThrow('INSUFFICIENT_STOCK');
  });
  it('checks variant stock on update', async () => {
    db.cartItem.findFirst.mockResolvedValue({ product: { stockQuantity: 5 }, variant: { stockQuantity: 1 } });
    await expect(updateCartItemQuantity('i', 'c', 2)).rejects.toThrow('INSUFFICIENT_STOCK');
  });
  it.each([-1, 1.5, NaN, Infinity])('rejects invalid update %s', async (quantity) => {
    await expect(updateCartItemQuantity('i', 'c', quantity)).rejects.toThrow('INVALID_QUANTITY');
  });
  it('deletes on zero, scoped to the owner', async () => {
    expect(await updateCartItemQuantity('i', 'c', 0)).toBeNull();
    expect(db.cartItem.deleteMany).toHaveBeenCalledWith({ where: { id: 'i', cartId: 'c' } });
  });
  it('refuses another cart item', async () => {
    db.cartItem.findFirst.mockResolvedValue(null);
    await expect(updateCartItemQuantity('i', 'c', 0)).rejects.toThrow('CART_ITEM_NOT_FOUND');
    expect(db.cartItem.deleteMany).not.toHaveBeenCalled();
  });
  it('scopes direct removal to the owner', async () => {
    await removeCartItem('i', 'c');
    expect(db.cartItem.deleteMany).toHaveBeenCalledWith({ where: { id: 'i', cartId: 'c' } });
  });
});
