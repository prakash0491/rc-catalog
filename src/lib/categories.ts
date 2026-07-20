import { Prisma } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

export type CategoryUiShape = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  displayOrder: number;
  isActive: boolean;
  productCount: number;
};

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, 'Name is required.'),
  slug: z.string().trim().optional().default(''),
  description: z.string().trim().optional().default(''),
  image: z.string().trim().url('Image URL must be valid.').optional().or(z.literal('')).default(''),
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

function toCategoryUiShape(category: Prisma.CategoryGetPayload<{ include: { _count: { select: { products: true } } } }>): CategoryUiShape {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    displayOrder: category.displayOrder,
    isActive: category.isActive,
    productCount: category._count.products,
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

  const [items, total] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { updatedAt: 'desc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      include: { _count: { select: { products: true } } },
    }),
    prisma.category.count({ where }),
  ]);

  return {
    items: items.map(toCategoryUiShape),
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.limit)),
    },
  };
}

export async function getCategoryById(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  return category ? toCategoryUiShape(category) : null;
}

export async function getCategoryForEdit(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
}

export function serializeCategoryForSelect(category: { id: string; name: string; slug: string }) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
  };
}
