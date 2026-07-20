import { Prisma, StockStatus } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

export const ADMIN_PRODUCTS_PAGE_SIZE = 10;

export const adminProductInclude = {
  category: true,
  images: {
    orderBy: { sortOrder: 'asc' },
  },
} satisfies Prisma.ProductInclude;

export type AdminProductRecord = Prisma.ProductGetPayload<{
  include: typeof adminProductInclude;
}>;

export type AdminProductListItem = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  featured: boolean;
  newArrival: boolean;
  stockStatus: StockStatus;
  isActive: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  images: Array<{
    id: string;
    url: string;
    alt: string | null;
    sortOrder: number;
  }>;
};

export type AdminProductFormInput = {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  categoryId: string;
  featured: boolean;
  newArrival: boolean;
  isActive: boolean;
  stockStatus: StockStatus;
  images: string[];
};

function isCloudinaryUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'res.cloudinary.com' || url.hostname.endsWith('.cloudinary.com'));
  } catch {
    return false;
  }
}

export const adminProductFormSchema = z.object({
  name: z.string().trim().min(2, 'Name is required.'),
  slug: z.string().trim().optional().default(''),
  shortDescription: z.string().trim().min(10, 'Short description is required.'),
  description: z.string().trim().min(20, 'Description is required.'),
  price: z.coerce.number().positive('Price must be greater than zero.'),
  categoryId: z.string().trim().min(1, 'Category is required.'),
  featured: z.coerce.boolean().optional().default(false),
  newArrival: z.coerce.boolean().optional().default(false),
  isActive: z.coerce.boolean().optional().default(true),
  stockStatus: z.nativeEnum(StockStatus),
  images: z.array(z.string().trim().min(1).refine(isCloudinaryUrl, 'Product images must be uploaded to Cloudinary.')).optional().default([]),
});

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-') || 'product';
}

export function buildProductFormInput(formData: FormData): AdminProductFormInput {
  const parsed = adminProductFormSchema.parse({
    name: String(formData.get('name') ?? ''),
    slug: String(formData.get('slug') ?? ''),
    shortDescription: String(formData.get('shortDescription') ?? ''),
    description: String(formData.get('description') ?? ''),
    price: formData.get('price') ?? '',
    categoryId: String(formData.get('categoryId') ?? ''),
    featured: formData.get('featured') === 'on' || formData.get('featured') === 'true',
    newArrival: formData.get('newArrival') === 'on' || formData.get('newArrival') === 'true',
    isActive: formData.get('isActive') === 'on' || formData.get('isActive') === 'true',
    stockStatus: String(formData.get('stockStatus') ?? StockStatus.IN_STOCK),
    images: formData
      .getAll('images')
      .map((value) => String(value).trim())
      .filter(Boolean),
  });

  return {
    ...parsed,
    slug: parsed.slug ? slugify(parsed.slug) : slugify(parsed.name),
    images: parsed.images.map((image) => image.trim()).filter(Boolean),
  };
}

export async function resolveUniqueProductSlug(baseSlug: string, excludeId?: string) {
  const normalizedBaseSlug = slugify(baseSlug);
  let candidate = normalizedBaseSlug;
  let suffix = 2;

  while (
    await prisma.product.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    })
  ) {
    candidate = `${normalizedBaseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export function serializeAdminProduct(product: AdminProductRecord): AdminProductListItem {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    price: Number(product.price),
    featured: product.featured,
    newArrival: product.newArrival,
    stockStatus: product.stockStatus,
    isActive: product.isActive,
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
      sortOrder: image.sortOrder,
    })),
  };
}

export async function getAdminProductsList(params: {
  search?: string;
  categoryId?: string;
  page: number;
  limit: number;
}) {
  const where: Prisma.ProductWhereInput = {};

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { slug: { contains: params.search, mode: 'insensitive' } },
      { shortDescription: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  if (params.categoryId) {
    where.categoryId = params.categoryId;
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      include: adminProductInclude,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: items.map(serializeAdminProduct),
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.limit)),
    },
  };
}

export async function getAdminProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: adminProductInclude,
  });

  return product ? serializeAdminProduct(product) : null;
}

export function buildImageInputs(images: string[]) {
  return images.map((url, index) => ({
    url,
    sortOrder: index,
  }));
}
