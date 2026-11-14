import { beforeEach, describe, expect, it, vi } from 'vitest';
const db = vi.hoisted(() => ({
  product: { findFirst: vi.fn() },
  wishlistItem: { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn(), count: vi.fn() },
}));
vi.mock('@/lib/prisma', () => ({ prisma: db }));
import { addProductToWishlist, getWishlistCount, getWishlistForCustomer, getWishlistProductIds, toggleWishlistItem } from '@/lib/wishlist';
beforeEach(() => vi.resetAllMocks());
describe('wishlist', () => {
  it('rejects unpublished products', async () => {
    db.product.findFirst.mockResolvedValue(null);
    await expect(addProductToWishlist('customer', 'p')).rejects.toThrow('PRODUCT_NOT_FOUND');
    expect(db.wishlistItem.upsert).not.toHaveBeenCalled();
  });
  it('adds items idempotently', async () => {
    db.product.findFirst.mockResolvedValue({ id: 'p' });
    await addProductToWishlist('customer', 'p');
    expect(db.wishlistItem.upsert).toHaveBeenCalledWith({ where: { customerId_productId: { customerId: 'customer', productId: 'p' } }, create: { customerId: 'customer', productId: 'p' }, update: {} });
  });
  it('toggles an existing item off without touching other customers', async () => {
    db.wishlistItem.findUnique.mockResolvedValue({ id: 'item' });
    expect(await toggleWishlistItem('customer', 'p')).toEqual({ wishlisted: false });
    expect(db.wishlistItem.deleteMany).toHaveBeenCalledWith({ where: { customerId: 'customer', productId: 'p' } });
  });
  it('toggles missing items on', async () => {
    db.wishlistItem.findUnique.mockResolvedValue(null);
    db.product.findFirst.mockResolvedValue({ id: 'p' });
    expect(await toggleWishlistItem('customer', 'p')).toEqual({ wishlisted: true });
  });
  it('loads IDs and counts for only the current customer', async () => {
    db.wishlistItem.findMany.mockResolvedValue([{ productId: 'p' }]);
    db.wishlistItem.count.mockResolvedValue(1);
    expect(await getWishlistProductIds('customer')).toEqual(['p']);
    expect(await getWishlistCount('customer')).toBe(1);
    expect(db.wishlistItem.count).toHaveBeenCalledWith({
      where: { customerId: 'customer', product: { isActive: true, status: 'PUBLISHED', deletedAt: null } },
    });
  });
  it('hides wishlist entries for unpublished products', async () => {
    db.wishlistItem.findMany.mockResolvedValue([]);
    await getWishlistForCustomer('customer');
    expect(db.wishlistItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { customerId: 'customer', product: { isActive: true, status: 'PUBLISHED', deletedAt: null } },
      })
    );
  });
});
