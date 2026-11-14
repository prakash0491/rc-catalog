import { beforeEach, describe, expect, it, vi } from 'vitest';
const db = vi.hoisted(() => ({
  businessSettings: { findFirst: vi.fn() },
  banner: { findFirst: vi.fn() },
  offer: { findMany: vi.fn() },
  category: { findMany: vi.fn() },
  product: { count: vi.fn(), findMany: vi.fn() },
  inquiry: { count: vi.fn(), findMany: vi.fn() },
}));
vi.mock('@/lib/prisma', () => ({ prisma: db }));
import { getPublicContent } from '@/lib/public-content';
import { getAdminDashboardData } from '@/lib/admin-dashboard';
beforeEach(() => {
  vi.resetAllMocks();
  db.businessSettings.findFirst.mockResolvedValue(null);
  db.banner.findFirst.mockResolvedValue(null);
  db.offer.findMany.mockResolvedValue([]);
  db.category.findMany.mockResolvedValue([]);
});
describe('public content', () => {
  it('uses configured business identity and maps category images', async () => {
    db.businessSettings.findFirst.mockResolvedValue({ id: 'business', businessName: 'RC', email: 'contact@example.com' });
    db.category.findMany.mockResolvedValue([{ id: 'category', name: 'Home', slug: 'home', image: null, description: null }]);
    const content = await getPublicContent();
    expect(content.businessProfile.name).toBe('RC');
    expect(content.businessProfile.email).toBe('contact@example.com');
    expect(content.categories[0].image).toBe('/images/placeholder.svg');
  });
  it('keeps the public shell usable during a database outage', async () => {
    db.businessSettings.findFirst.mockRejectedValue(new Error('database unavailable'));
    const content = await getPublicContent();
    expect(content.businessProfile.name).toBeTruthy();
    expect(content.categories).toEqual([]);
    expect(content.heroBanner).toBeNull();
  });
  it('respects scheduled offers', async () => {
    await getPublicContent();
    expect(db.offer.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
      isActive: true,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: expect.any(Date) } }] },
        { OR: [{ endDate: null }, { endDate: { gte: expect.any(Date) } }] },
      ],
    }) }));
  });
});
describe('admin dashboard', () => {
  it('separates archived counts and serializes inquiry dates', async () => {
    db.product.count.mockResolvedValue(2);
    db.product.findMany.mockResolvedValue([]);
    db.inquiry.count.mockResolvedValue(1);
    db.inquiry.findMany.mockResolvedValue([{ id: 'inquiry', name: 'Test', email: 'test@example.com', status: 'NEW', product: null, createdAt: new Date('2026-01-01') }]);
    const result = await getAdminDashboardData();
    expect(result.stats.openInquiries).toBe(1);
    expect(db.product.count).toHaveBeenCalledWith({ where: { deletedAt: { not: null } } });
    expect(result.recentInquiries[0]).toMatchObject({ productName: null, createdAt: '2026-01-01T00:00:00.000Z' });
  });
});
