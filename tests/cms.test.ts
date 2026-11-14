import { beforeEach, describe, expect, it, vi } from 'vitest';
const db = vi.hoisted(() => ({
  product: { findFirst: vi.fn(), updateMany: vi.fn() },
  category: { findFirst: vi.fn() },
  businessSettings: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  inquiry: { update: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({ prisma: db }));
import { Prisma } from '@prisma/client';
import { buildImageInputs, buildProductFormInput, bulkUpdateProducts, resolveUniqueProductSlug, serializeAdminProduct, updateAdminProduct } from '@/lib/admin-products';
import { parseCategoryForm, resolveUniqueCategorySlug } from '@/lib/categories';
import { parseBannerForm } from '@/lib/banners';
import { parseOfferForm } from '@/lib/offers';
import { parseBusinessSettingsForm, upsertBusinessSettings } from '@/lib/business-settings';
import { updateInquiryStatus } from '@/lib/admin-inquiries';

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}
const productValues = { name: 'Test product', price: '19.99', shortDescription: 'A useful product summary', description: 'A sufficiently long product description.', categoryId: 'category', stockQuantity: '3' };
beforeEach(() => vi.resetAllMocks());

describe('admin product forms', () => {
  it('normalizes prices, stock status and specifications', () => {
    const input = buildProductFormInput(form(productValues));
    expect(input).toMatchObject({ price: 19.99, mrp: null, slug: 'test-product', stockStatus: 'LOW_STOCK', variants: [], specifications: [] });
  });
  it('marks zero stock unavailable', () => {
    expect(buildProductFormInput(form({ ...productValues, stockQuantity: '0' })).stockStatus).toBe('OUT_OF_STOCK');
  });
  it.each(['-1', '0', 'NaN'])('rejects invalid price %s', (price) => {
    expect(() => buildProductFormInput(form({ ...productValues, price }))).toThrow();
  });
  it('rejects non-Cloudinary images', () => {
    expect(() => buildProductFormInput(form({ ...productValues, images: 'https://example.com/image.jpg' }))).toThrow();
  });
  it('resolves duplicate slugs without overwriting products', async () => {
    db.product.findFirst.mockResolvedValueOnce({ id: 'taken' }).mockResolvedValueOnce(null);
    expect(await resolveUniqueProductSlug('Test Product')).toBe('test-product-2');
  });
  it('marks exactly one thumbnail', () => {
    expect(buildImageInputs(['a', 'b'], 'b').map((i) => i.isThumbnail)).toEqual([false, true]);
  });
  it('preserves existing variant IDs and deactivates removed options on edit', async () => {
    db.product.findFirst.mockResolvedValueOnce({ id: 'product' }).mockResolvedValueOnce(null);
    const tx = {
      product: { update: vi.fn(), findUnique: vi.fn().mockResolvedValue(null) },
      productImage: { deleteMany: vi.fn() },
      productSpecification: { deleteMany: vi.fn() },
      productVariant: {
        findMany: vi.fn().mockResolvedValue([{ id: 'v-large', optionName: 'Size', optionValue: 'Large' }, { id: 'v-small', optionName: 'Size', optionValue: 'Small' }]),
        update: vi.fn(), create: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn(),
      },
    };
    db.$transaction.mockImplementation(async (callback) => callback(tx));
    const input = buildProductFormInput(form(productValues));
    input.variants = [{ optionName: 'Size', optionValue: 'Large', sku: null, priceOverride: null, stockQuantity: 5, isActive: true }];
    await updateAdminProduct('product', input);
    expect(tx.productVariant.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'v-large' } }));
    expect(tx.productVariant.deleteMany).not.toHaveBeenCalled();
    expect(tx.productVariant.updateMany).toHaveBeenCalledWith({ where: { id: { in: ['v-small'] } }, data: { isActive: false } });
  });
  it('keeps a zero-price variant override instead of dropping it', () => {
    const record = {
      id: 'product', slug: 'product', name: 'Product', shortDescription: 'Short', description: 'Description',
      price: new Prisma.Decimal(10), mrp: null, discountPercent: 0, sku: null, stockQuantity: 1,
      lowStockThreshold: 5, featured: false, newArrival: false, bestSeller: false, status: 'DRAFT',
      stockStatus: 'IN_STOCK', isActive: true, metaTitle: null, metaDescription: null, deletedAt: null,
      category: { id: 'category', name: 'Category', slug: 'category' }, images: [], specifications: [],
      variants: [{ id: 'variant', optionName: 'Size', optionValue: 'Free', sku: null, priceOverride: new Prisma.Decimal(0), stockQuantity: 1, sortOrder: 0, isActive: true }],
    };
    const serialized = serializeAdminProduct(record as unknown as Parameters<typeof serializeAdminProduct>[0]);
    expect(serialized.variants[0].priceOverride).toBe(0);
  });
  it('never revives archived products through bulk actions', async () => {
    db.product.updateMany.mockResolvedValue({ count: 1 });
    await bulkUpdateProducts(['product'], 'publish');
    expect(db.product.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['product'] }, deletedAt: null },
      data: { status: 'PUBLISHED', isActive: true, deletedAt: null },
    });
  });
});
describe('categories', () => {
  it('normalizes optional values and generates slugs', () => {
    expect(parseCategoryForm(form({ name: '  Home & Living ', isActive: 'on' }))).toMatchObject({ name: 'Home & Living', slug: 'home-living', description: null, image: null, isActive: true });
  });
  it('rejects invalid slugs', () => {
    expect(() => parseCategoryForm(form({ name: 'Home', slug: 'Invalid Slug' }))).toThrow();
  });
  it('resolves collisions', async () => {
    db.category.findFirst.mockResolvedValueOnce({ id: 'taken' }).mockResolvedValueOnce(null);
    expect(await resolveUniqueCategorySlug('Home')).toBe('home-2');
  });
});
describe('banners and offers', () => {
  it('normalizes banner form fields', () => {
    expect(parseBannerForm(form({ title: ' Summer ', image: 'https://res.cloudinary.com/demo/image.jpg', buttonUrl: '/products', isActive: 'true' }))).toMatchObject({ title: 'Summer', buttonUrl: '/products', subtitle: null, isActive: true });
  });
  it.each(['javascript:alert(1)', '//evil.example', '/\\evil.example'])('rejects unsafe banner links %s', (buttonUrl) => {
    expect(() => parseBannerForm(form({ title: 'Summer', image: 'https://res.cloudinary.com/demo/image.jpg', buttonUrl }))).toThrow();
  });
  it('normalizes offers', () => {
    expect(parseOfferForm(form({ title: ' Sale ', isActive: 'on' }))).toEqual({ title: 'Sale', description: null, image: null, priority: 0, isActive: true });
  });
});
describe('settings and inquiries', () => {
  it('rejects invalid business email', () => {
    expect(() => parseBusinessSettingsForm(form({ businessName: 'RC', email: 'invalid' }))).toThrow();
  });
  it('rejects executable social links', () => {
    expect(() => parseBusinessSettingsForm(form({ businessName: 'RC', instagram: 'javascript:alert(1)' }))).toThrow();
    expect(() => parseBusinessSettingsForm(form({ businessName: 'RC', facebook: '//evil.example' }))).toThrow();
  });
  it('accepts https and internal social links', () => {
    const parsed = parseBusinessSettingsForm(
      form({ businessName: 'RC', instagram: 'https://instagram.com/store', facebook: '/store' })
    );
    expect(parsed.instagram).toBe('https://instagram.com/store');
    expect(parsed.facebook).toBe('/store');
  });
  it('creates settings with null optional fields', async () => {
    db.businessSettings.findFirst.mockResolvedValue(null);
    await upsertBusinessSettings(parseBusinessSettingsForm(form({ businessName: 'RC' })));
    expect(db.businessSettings.create).toHaveBeenCalledWith({ data: expect.objectContaining({ businessName: 'RC', email: null, logo: null }) });
  });
  it('updates the existing settings row', async () => {
    db.businessSettings.findFirst.mockResolvedValue({ id: 'settings' });
    await upsertBusinessSettings(parseBusinessSettingsForm(form({ businessName: 'RC' })));
    expect(db.businessSettings.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'settings' } }));
    expect(db.businessSettings.create).not.toHaveBeenCalled();
  });
  it('returns only the updated inquiry identity and status', async () => {
    db.inquiry.update.mockResolvedValue({ id: 'inquiry', status: 'CONTACTED', email: 'private@example.com' });
    expect(await updateInquiryStatus('inquiry', 'CONTACTED')).toEqual({ id: 'inquiry', status: 'CONTACTED' });
  });
});
