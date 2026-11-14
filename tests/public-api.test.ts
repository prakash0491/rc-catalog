import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const db = vi.hoisted(() => ({ product: { findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn() } }));
vi.mock('@/lib/prisma', () => ({ prisma: db }));
import { GET as list } from '@/app/api/products/route';
import { GET as featured } from '@/app/api/products/featured/route';
import { GET as arrivals } from '@/app/api/products/new/route';
import { GET as detail } from '@/app/api/products/[slug]/route';
beforeEach(() => {
  vi.resetAllMocks();
  db.product.findMany.mockResolvedValue([]);
  db.product.count.mockResolvedValue(0);
});
const visibility = { isActive: true, status: 'PUBLISHED', deletedAt: null, category: { isActive: true } };
describe('public product API', () => {
  it('uses the same visibility rules as the storefront', async () => {
    const response = await list(new NextRequest('http://localhost/api/products?page=1.5&limit=2.5'));
    expect(response.status).toBe(200);
    expect(db.product.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: visibility, skip: 0, take: 12 }));
  });
  it.each([featured, arrivals])('hides draft, archived, and inactive-category products', async (handler) => {
    expect((await handler()).status).toBe(200);
    expect(db.product.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining(visibility) }));
  });
  it('hides unavailable products on the detail endpoint', async () => {
    db.product.findUnique.mockResolvedValue(null);
    const response = await detail(new NextRequest('http://localhost/api/products/hidden'), { params: Promise.resolve({ slug: 'hidden' }) });
    expect(response.status).toBe(404);
    expect(db.product.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: 'hidden', ...visibility } }));
  });
  it('returns 400 for invalid filters', async () => {
    expect((await list(new NextRequest('http://localhost/api/products?sort=invalid'))).status).toBe(400);
    expect(db.product.findMany).not.toHaveBeenCalled();
  });
  it('returns a safe error on database failure', async () => {
    db.product.findMany.mockRejectedValue(new Error('private database details'));
    const response = await list(new NextRequest('http://localhost/api/products'));
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain('private database details');
  });
});
