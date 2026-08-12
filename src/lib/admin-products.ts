import { Prisma, ProductStatus, StockStatus } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

export const ADMIN_PRODUCTS_PAGE_SIZE = 10;

export const adminProductInclude = {
  category: true,
  images: {
    orderBy: { sortOrder: 'asc' },
  },
  specifications: {
    orderBy: { sortOrder: 'asc' },
  },
  variants: {
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
  mrp: number | null;
  discountPercent: number;
  sku: string | null;
  stockQuantity: number;
  lowStockThreshold: number;
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  status: ProductStatus;
  stockStatus: StockStatus;
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  deletedAt: string | null;
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
    isThumbnail: boolean;
  }>;
  specifications: Array<{
    id: string;
    name: string;
    value: string;
    sortOrder: number;
  }>;
  variants: Array<{
    id: string;
    optionName: string;
    optionValue: string;
    sku: string | null;
    priceOverride: number | null;
    stockQuantity: number;
    sortOrder: number;
    isActive: boolean;
  }>;
};

export type AdminProductFormInput = {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  mrp: number | null;
  discountPercent: number;
  sku: string | null;
  stockQuantity: number;
  lowStockThreshold: number;
  categoryId: string;
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  status: ProductStatus;
  isActive: boolean;
  stockStatus: StockStatus;
  metaTitle: string | null;
  metaDescription: string | null;
  images: string[];
  thumbnailImage: string | null;
  specifications: Array<{ name: string; value: string }>;
  variants: Array<{
    optionName: string;
    optionValue: string;
    sku: string | null;
    priceOverride: number | null;
    stockQuantity: number;
    isActive: boolean;
  }>;
};

function isCloudinaryUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'res.cloudinary.com' || url.hostname.endsWith('.cloudinary.com'));
  } catch {
    return false;
  }
}

const optionalTrimmed = z.string().trim().optional().default('');

export const adminProductFormSchema = z.object({
  name: z.string().trim().min(2, 'Name is required.'),
  slug: z.string().trim().optional().default(''),
  shortDescription: z.string().trim().min(10, 'Short description is required.'),
  description: z.string().trim().min(20, 'Description is required.'),
  price: z.coerce.number().positive('Selling price must be greater than zero.'),
  mrp: z.coerce.number().nonnegative().optional().or(z.literal('')).default(''),
  discountPercent: z.coerce.number().int().min(0).max(100).optional().default(0),
  sku: optionalTrimmed,
  stockQuantity: z.coerce.number().int().min(0).optional().default(0),
  lowStockThreshold: z.coerce.number().int().min(0).optional().default(5),
  categoryId: z.string().trim().min(1, 'Category is required.'),
  featured: z.coerce.boolean().optional().default(false),
  newArrival: z.coerce.boolean().optional().default(false),
  bestSeller: z.coerce.boolean().optional().default(false),
  status: z.nativeEnum(ProductStatus).optional().default(ProductStatus.DRAFT),
  isActive: z.coerce.boolean().optional().default(true),
  stockStatus: z.nativeEnum(StockStatus),
  metaTitle: optionalTrimmed,
  metaDescription: optionalTrimmed,
  thumbnailImage: optionalTrimmed,
  images: z.array(z.string().trim().min(1).refine(isCloudinaryUrl, 'Product images must be uploaded to Cloudinary.')).optional().default([]),
  specificationNames: z.array(z.string()).optional().default([]),
  specificationValues: z.array(z.string()).optional().default([]),
  variantOptionNames: z.array(z.string()).optional().default([]),
  variantOptionValues: z.array(z.string()).optional().default([]),
  variantSkus: z.array(z.string()).optional().default([]),
  variantPriceOverrides: z.array(z.string()).optional().default([]),
  variantStockQuantities: z.array(z.string()).optional().default([]),
  variantActiveStates: z.array(z.string()).optional().default([]),
});

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['â€™]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-') || 'product';
}

function numberOrNull(value: unknown) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildStockStatus(quantity: number, lowStockThreshold: number, explicitStatus: StockStatus) {
  if (quantity <= 0) {
    return StockStatus.OUT_OF_STOCK;
  }

  if (quantity <= lowStockThreshold) {
    return StockStatus.LOW_STOCK;
  }

  return explicitStatus === StockStatus.OUT_OF_STOCK ? StockStatus.IN_STOCK : explicitStatus;
}

export function buildProductFormInput(formData: FormData): AdminProductFormInput {
  const parsed = adminProductFormSchema.parse({
    name: String(formData.get('name') ?? ''),
    slug: String(formData.get('slug') ?? ''),
    shortDescription: String(formData.get('shortDescription') ?? ''),
    description: String(formData.get('description') ?? ''),
    price: formData.get('price') ?? '',
    mrp: formData.get('mrp') ?? '',
    discountPercent: formData.get('discountPercent') ?? 0,
    sku: String(formData.get('sku') ?? ''),
    stockQuantity: formData.get('stockQuantity') ?? 0,
    lowStockThreshold: formData.get('lowStockThreshold') ?? 5,
    categoryId: String(formData.get('categoryId') ?? ''),
    featured: formData.get('featured') === 'on' || formData.get('featured') === 'true',
    newArrival: formData.get('newArrival') === 'on' || formData.get('newArrival') === 'true',
    bestSeller: formData.get('bestSeller') === 'on' || formData.get('bestSeller') === 'true',
    status: String(formData.get('status') ?? ProductStatus.DRAFT),
    isActive: formData.get('isActive') === 'on' || formData.get('isActive') === 'true',
    stockStatus: String(formData.get('stockStatus') ?? StockStatus.IN_STOCK),
    metaTitle: String(formData.get('metaTitle') ?? ''),
    metaDescription: String(formData.get('metaDescription') ?? ''),
    thumbnailImage: String(formData.get('thumbnailImage') ?? ''),
    images: formData
      .getAll('images')
      .map((value) => String(value).trim())
      .filter(Boolean),
    specificationNames: formData.getAll('specificationNames').map(String),
    specificationValues: formData.getAll('specificationValues').map(String),
    variantOptionNames: formData.getAll('variantOptionNames').map(String),
    variantOptionValues: formData.getAll('variantOptionValues').map(String),
    variantSkus: formData.getAll('variantSkus').map(String),
    variantPriceOverrides: formData.getAll('variantPriceOverrides').map(String),
    variantStockQuantities: formData.getAll('variantStockQuantities').map(String),
    variantActiveStates: formData.getAll('variantActiveStates').map(String),
  });

  const specifications = parsed.specificationNames
    .map((name, index) => ({
      name: name.trim(),
      value: (parsed.specificationValues[index] ?? '').trim(),
    }))
    .filter((item) => item.name && item.value);

  const variants = parsed.variantOptionNames
    .map((optionName, index) => ({
      optionName: optionName.trim(),
      optionValue: (parsed.variantOptionValues[index] ?? '').trim(),
      sku: (parsed.variantSkus[index] ?? '').trim() || null,
      priceOverride: numberOrNull(parsed.variantPriceOverrides[index]),
      stockQuantity: Math.max(0, Number.parseInt(parsed.variantStockQuantities[index] ?? '0', 10) || 0),
      isActive: parsed.variantActiveStates[index] === 'true',
    }))
    .filter((item) => item.optionName && item.optionValue);

  return {
    name: parsed.name,
    slug: parsed.slug ? slugify(parsed.slug) : slugify(parsed.name),
    shortDescription: parsed.shortDescription,
    description: parsed.description,
    price: parsed.price,
    mrp: numberOrNull(parsed.mrp),
    discountPercent: parsed.discountPercent,
    sku: parsed.sku || null,
    stockQuantity: parsed.stockQuantity,
    lowStockThreshold: parsed.lowStockThreshold,
    categoryId: parsed.categoryId,
    featured: parsed.featured,
    newArrival: parsed.newArrival,
    bestSeller: parsed.bestSeller,
    status: parsed.status,
    isActive: parsed.isActive,
    stockStatus: buildStockStatus(parsed.stockQuantity, parsed.lowStockThreshold, parsed.stockStatus),
    metaTitle: parsed.metaTitle || null,
    metaDescription: parsed.metaDescription || null,
    images: parsed.images.map((image) => image.trim()).filter(Boolean),
    thumbnailImage: parsed.thumbnailImage || parsed.images[0] || null,
    specifications,
    variants,
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
    mrp: product.mrp ? Number(product.mrp) : null,
    discountPercent: product.discountPercent,
    sku: product.sku,
    stockQuantity: product.stockQuantity,
    lowStockThreshold: product.lowStockThreshold,
    featured: product.featured,
    newArrival: product.newArrival,
    bestSeller: product.bestSeller,
    status: product.status,
    stockStatus: product.stockStatus,
    isActive: product.isActive,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    deletedAt: product.deletedAt?.toISOString() ?? null,
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
      isThumbnail: image.isThumbnail,
    })),
    specifications: product.specifications.map((specification) => ({
      id: specification.id,
      name: specification.name,
      value: specification.value,
      sortOrder: specification.sortOrder,
    })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      optionName: variant.optionName,
      optionValue: variant.optionValue,
      sku: variant.sku,
      priceOverride: variant.priceOverride ? Number(variant.priceOverride) : null,
      stockQuantity: variant.stockQuantity,
      sortOrder: variant.sortOrder,
      isActive: variant.isActive,
    })),
  };
}

export async function getAdminProductsList(params: {
  search?: string;
  categoryId?: string;
  status?: ProductStatus;
  page: number;
  limit: number;
}) {
  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
  };

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { slug: { contains: params.search, mode: 'insensitive' } },
      { sku: { contains: params.search, mode: 'insensitive' } },
      { shortDescription: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  if (params.categoryId) {
    where.categoryId = params.categoryId;
  }

  if (params.status) {
    where.status = params.status;
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
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: adminProductInclude,
  });

  return product ? serializeAdminProduct(product) : null;
}

export function buildImageInputs(images: string[], thumbnailImage?: string | null) {
  return images.map((url, index) => ({
    url,
    sortOrder: index,
    isThumbnail: thumbnailImage ? url === thumbnailImage : index === 0,
  }));
}

function buildProductWriteData(input: AdminProductFormInput, slug: string): Prisma.ProductUncheckedCreateInput {
  return {
    name: input.name,
    slug,
    shortDescription: input.shortDescription,
    description: input.description,
    price: new Prisma.Decimal(input.price),
    mrp: input.mrp === null ? null : new Prisma.Decimal(input.mrp),
    discountPercent: input.discountPercent,
    sku: input.sku,
    stockQuantity: input.stockQuantity,
    lowStockThreshold: input.lowStockThreshold,
    categoryId: input.categoryId,
    featured: input.featured,
    newArrival: input.newArrival,
    bestSeller: input.bestSeller,
    status: input.status,
    stockStatus: input.stockStatus,
    isActive: input.isActive && input.status === ProductStatus.PUBLISHED,
    metaTitle: input.metaTitle,
    metaDescription: input.metaDescription,
  };
}

export async function createAdminProduct(input: AdminProductFormInput) {
  const slug = await resolveUniqueProductSlug(input.slug || input.name);
  const images = buildImageInputs(input.images, input.thumbnailImage);

  const createdProduct = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: buildProductWriteData(input, slug),
    });

    if (images.length > 0) {
      await tx.productImage.createMany({
        data: images.map((image) => ({
          productId: product.id,
          url: image.url,
          alt: input.name,
          sortOrder: image.sortOrder,
          isThumbnail: image.isThumbnail,
        })),
      });
    }

    if (input.specifications.length > 0) {
      await tx.productSpecification.createMany({
        data: input.specifications.map((item, index) => ({
          productId: product.id,
          name: item.name,
          value: item.value,
          sortOrder: index,
        })),
      });
    }

    if (input.variants.length > 0) {
      await tx.productVariant.createMany({
        data: input.variants.map((variant, index) => ({
          productId: product.id,
          optionName: variant.optionName,
          optionValue: variant.optionValue,
          sku: variant.sku,
          priceOverride: variant.priceOverride === null ? null : new Prisma.Decimal(variant.priceOverride),
          stockQuantity: variant.stockQuantity,
          sortOrder: index,
          isActive: variant.isActive,
        })),
      });
    }

    return tx.product.findUnique({
      where: { id: product.id },
      include: adminProductInclude,
    });
  });

  return createdProduct ? serializeAdminProduct(createdProduct) : null;
}

export async function updateAdminProduct(id: string, input: AdminProductFormInput) {
  const existing = await prisma.product.findFirst({ where: { id, deletedAt: null }, select: { id: true } });

  if (!existing) {
    return null;
  }

  const slug = await resolveUniqueProductSlug(input.slug || input.name, existing.id);
  const images = buildImageInputs(input.images, input.thumbnailImage);

  const updatedProduct = await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: existing.id },
      data: buildProductWriteData(input, slug),
    });

    await tx.productImage.deleteMany({ where: { productId: existing.id } });
    await tx.productSpecification.deleteMany({ where: { productId: existing.id } });
    await tx.productVariant.deleteMany({ where: { productId: existing.id } });

    if (images.length > 0) {
      await tx.productImage.createMany({
        data: images.map((image) => ({
          productId: existing.id,
          url: image.url,
          alt: input.name,
          sortOrder: image.sortOrder,
          isThumbnail: image.isThumbnail,
        })),
      });
    }

    if (input.specifications.length > 0) {
      await tx.productSpecification.createMany({
        data: input.specifications.map((item, index) => ({
          productId: existing.id,
          name: item.name,
          value: item.value,
          sortOrder: index,
        })),
      });
    }

    if (input.variants.length > 0) {
      await tx.productVariant.createMany({
        data: input.variants.map((variant, index) => ({
          productId: existing.id,
          optionName: variant.optionName,
          optionValue: variant.optionValue,
          sku: variant.sku,
          priceOverride: variant.priceOverride === null ? null : new Prisma.Decimal(variant.priceOverride),
          stockQuantity: variant.stockQuantity,
          sortOrder: index,
          isActive: variant.isActive,
        })),
      });
    }

    return tx.product.findUnique({
      where: { id: existing.id },
      include: adminProductInclude,
    });
  });

  return updatedProduct ? serializeAdminProduct(updatedProduct) : null;
}

export async function softDeleteAdminProduct(id: string) {
  const existing = await prisma.product.findFirst({ where: { id, deletedAt: null }, select: { id: true } });

  if (!existing) {
    return false;
  }

  await prisma.product.update({
    where: { id: existing.id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      status: ProductStatus.DRAFT,
    },
  });

  return true;
}

export async function duplicateAdminProduct(id: string) {
  const existing = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: adminProductInclude,
  });

  if (!existing) {
    return null;
  }

  const slug = await resolveUniqueProductSlug(`${existing.slug}-copy`);
  const copy = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name: `${existing.name} Copy`,
        slug,
        shortDescription: existing.shortDescription,
        description: existing.description,
        price: existing.price,
        mrp: existing.mrp,
        discountPercent: existing.discountPercent,
        sku: null,
        stockQuantity: existing.stockQuantity,
        lowStockThreshold: existing.lowStockThreshold,
        categoryId: existing.categoryId,
        featured: false,
        newArrival: false,
        bestSeller: false,
        status: ProductStatus.DRAFT,
        stockStatus: existing.stockStatus,
        isActive: false,
        metaTitle: existing.metaTitle,
        metaDescription: existing.metaDescription,
      },
    });

    if (existing.images.length > 0) {
      await tx.productImage.createMany({
        data: existing.images.map((image) => ({
          productId: product.id,
          url: image.url,
          alt: image.alt,
          sortOrder: image.sortOrder,
          isThumbnail: image.isThumbnail,
        })),
      });
    }

    if (existing.specifications.length > 0) {
      await tx.productSpecification.createMany({
        data: existing.specifications.map((item) => ({
          productId: product.id,
          name: item.name,
          value: item.value,
          sortOrder: item.sortOrder,
        })),
      });
    }

    if (existing.variants.length > 0) {
      await tx.productVariant.createMany({
        data: existing.variants.map((variant) => ({
          productId: product.id,
          optionName: variant.optionName,
          optionValue: variant.optionValue,
          sku: null,
          priceOverride: variant.priceOverride,
          stockQuantity: variant.stockQuantity,
          sortOrder: variant.sortOrder,
          isActive: variant.isActive,
        })),
      });
    }

    return tx.product.findUnique({ where: { id: product.id }, include: adminProductInclude });
  });

  return copy ? serializeAdminProduct(copy) : null;
}

export async function bulkUpdateProducts(ids: string[], action: 'delete' | 'publish' | 'draft') {
  const data =
    action === 'delete'
      ? { deletedAt: new Date(), isActive: false, status: ProductStatus.DRAFT }
      : action === 'publish'
        ? { status: ProductStatus.PUBLISHED, isActive: true, deletedAt: null }
        : { status: ProductStatus.DRAFT, isActive: false };

  const result = await prisma.product.updateMany({
    where: {
      id: { in: ids },
    },
    data,
  });

  return result.count;
}
