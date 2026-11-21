import { beforeEach, describe, expect, it, vi } from 'vitest';
const db = vi.hoisted(() => ({ product: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() }, category: { findMany: vi.fn() } }));
vi.mock('@/lib/prisma', () => ({ prisma: db }));
import { getProductSearchSuggestions, getPublicProductBySlug, listPublicProducts, parseProductListQuery } from '@/lib/products';
import { normalizeProductForUi, type ProductApiItem } from '@/lib/products-api';
beforeEach(() => {
  vi.resetAllMocks();
  db.product.findMany.mockResolvedValue([]);
  db.product.count.mockResolvedValue(0);
  db.category.findMany.mockResolvedValue([]);
});
describe('catalog query parsing', () => {
  it('handles repeated query values and trims input', () => {
    expect(parseProductListQuery({ search: [' tea ', 'ignored'], category: ' home ', sort: 'price-asc', page: '2' })).toMatchObject({ search: 'tea', category: 'home', sort: 'price-asc', page: 2 });
  });
  it.each(['-1', '1.5', 'Infinity', '9007199254740992'])('rejects invalid pages %s', (page) => {
    expect(parseProductListQuery({ page }).page).toBe(1);
  });
  it('ignores malformed prices and filters', () => {
    expect(parseProductListQuery({ minPrice: '-1', maxPrice: 'Infinity', sort: 'unsafe', availability: 'unsafe' })).toMatchObject({ minPrice: undefined, maxPrice: undefined, sort: 'featured', availability: undefined });
  });
});
describe('public catalog visibility', () => {
  it('filters hidden categories even when no category filter is supplied', async () => {
    await listPublicProducts({ page: 1, limit: 12 });
    expect(db.product.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ isActive: true, status: 'PUBLISHED', deletedAt: null, category: { isActive: true } }) }));
  });
  it('does not expose inactive variants on detail pages', async () => {
    db.product.findFirst.mockResolvedValue(null);
    expect(await getPublicProductBySlug('missing')).toBeNull();
    expect(db.product.findFirst).toHaveBeenCalledWith(expect.objectContaining({ include: expect.objectContaining({ variants: expect.objectContaining({ where: { isActive: true } }) }) }));
  });
  it('matches category names and brand specifications in listings and suggestions', async () => {
    await listPublicProducts({ page: 1, limit: 12, search: 'Drift' });
    await getProductSearchSuggestions('Drift');

    const match = { contains: 'Drift', mode: 'insensitive' };
    expect(db.product.findMany).toHaveBeenCalledTimes(2);
    for (const [query] of db.product.findMany.mock.calls) {
      expect(query.where).toMatchObject({
        category: { isActive: true },
        OR: expect.arrayContaining([
          { category: { name: match } },
          { specifications: { some: { name: { equals: 'brand', mode: 'insensitive' }, value: match } } },
        ]),
      });
    }
  });
  it('provides a fallback for an empty image array', () => {
    const item = { id: 'p', price: 19.99, images: [] } as unknown as ProductApiItem;
    expect(normalizeProductForUi(item).images).toEqual(['/images/placeholder.svg']);
  });
});
