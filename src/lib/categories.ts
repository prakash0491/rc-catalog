import { Prisma, ProductStatus } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

/**
 * A product is part of the public/live catalog only when it is active,
 * published, and not soft-deleted. The storefront applies this filter
 * everywhere (see src/lib/products.ts), so admin category counts must use
 * the exact same rule to stay consistent with what customers actually see.
 */
export const liveProductWhere: Prisma.ProductWhereInput = {
  isActive: true,
  status: ProductStatus.PUBLISHED,
  deletedAt: null,
};

export type CategoryUiShape = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  displayOrder: number;
  isActive: boolean;
  /** Number of products visible in the live storefront. */
  productCount: number;
  /** Total products attached to the category (including drafts/soft-deleted). Used for delete protection. */
  totalProductCount: number;
};

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, 'Name is required.'),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]*$/, 'Slug is invalid. Use lowercase letters, numbers, and hyphens only.')
    .optional()
    .default(''),
  description: z.string().trim().optional().default(''),
  image: z
    .string()
    .trim()
    .refine((value) => !value || value.startsWith('/') || z.string().url().safeParse(value).success, 'Image URL must be valid.')
    .optional()
    .or(z.literal(''))
    .default(''),
  displayOrder: z.coerce.number().int().min(0, 'Display order must be zero or greater.').optional().default(0),
  isActive: z.coerce.boolean().optional().default(true),
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;

type CategoryWriteInput = {
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  displayOrder: number;
  isActive: boolean;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-') || 'category';
}

function normalizeCategoryInput(input: CategoryFormInput): CategoryWriteInput {
  const slug = input.slug.trim();

  return {
    ...input,
    slug: slug ? slugify(slug) : slugify(input.name),
    description: input.description.trim() || null,
    image: input.image.trim() || null,
  };
}

const categoryWithLiveCountInclude = {
  _count: {
    select: {
      products: { where: liveProductWhere },
    },
  },
} satisfies Prisma.CategoryInclude;

type CategoryWithLiveCount = Prisma.CategoryGetPayload<{ include: typeof categoryWithLiveCountInclude }>;

function toCategoryUiShape(category: CategoryWithLiveCount, totalProductCount: number): CategoryUiShape {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    displayOrder: category.displayOrder,
    isActive: category.isActive,
    productCount: category._count.products,
    totalProductCount,
  };
}

export function parseCategoryForm(formData: FormData): CategoryWriteInput {
  return normalizeCategoryInput(
    categoryFormSchema.parse({
      name: String(formData.get('name') ?? ''),
      slug: String(formData.get('slug') ?? ''),
      description: String(formData.get('description') ?? ''),
      image: String(formData.get('image') ?? ''),
      displayOrder: formData.get('displayOrder') ?? 0,
      isActive: formData.get('isActive') === 'on' || formData.get('isActive') === 'true',
    })
  );
}

export async function resolveUniqueCategorySlug(baseSlug: string, excludeId?: string) {
  const normalizedBaseSlug = slugify(baseSlug);
  let candidate = normalizedBaseSlug;
  let suffix = 2;

  while (
    await prisma.category.findFirst({
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

export async function listCategories(params: { search?: string; page: number; limit: number }) {
  const where: Prisma.CategoryWhereInput = {};

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { slug: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const matchingCategoryIds = (await prisma.category.findMany({ where, select: { id: true } })).map((row) => row.id);

  const [categories, total, totalByCategory] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { updatedAt: 'desc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      include: categoryWithLiveCountInclude,
    }),
    prisma.category.count({ where }),
    prisma.product.groupBy({
      by: ['categoryId'],
      where: { categoryId: { in: matchingCategoryIds } },
      _count: { _all: true },
    }),
  ]);

  const totalProductsByCategory = new Map(totalByCategory.map((row) => [row.categoryId, row._count._all]));

  return {
    items: categories.map((category) => toCategoryUiShape(category, totalProductsByCategory.get(category.id) ?? 0)),
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.limit)),
    },
  };
}

export async function getCategoryById(id: string) {
  const [category, totalProductCount] = await Promise.all([
    prisma.category.findUnique({
      where: { id },
      include: categoryWithLiveCountInclude,
    }),
    prisma.product.count({ where: { categoryId: id } }),
  ]);

  return category ? toCategoryUiShape(category, totalProductCount) : null;
}

export async function getCategoryForEdit(id: string) {
  const [category, totalProductCount] = await Promise.all([
    prisma.category.findUnique({
      where: { id },
      include: categoryWithLiveCountInclude,
    }),
    prisma.product.count({ where: { categoryId: id } }),
  ]);

  return category
    ? {
        ...category,
        _count: {
          products: category._count.products,
          totalProducts: totalProductCount,
        },
      }
    : null;
}

export function serializeCategoryForApi(category: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  displayOrder: number;
  isActive: boolean;
  _count: { products: number; totalProducts: number };
}) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    displayOrder: category.displayOrder,
    isActive: category.isActive,
    productCount: category._count.products,
    totalProductCount: category._count.totalProducts,
  };
}

export function serializeCategoryForSelect(category: { id: string; name: string; slug: string }) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
  };
}
