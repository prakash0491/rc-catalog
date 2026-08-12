import { Prisma } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

export const ADMIN_OFFERS_PAGE_SIZE = 10;

export const offerFormSchema = z.object({
  title: z.string().trim().min(2, 'Title is required.').max(160),
  description: z.string().trim().optional().default(''),
  image: z.string().trim().optional().default(''),
  priority: z.coerce.number().int().min(0).optional().default(0),
  isActive: z.coerce.boolean().optional().default(true),
});

export function parseOfferForm(formData: FormData) {
  const parsed = offerFormSchema.parse({
    title: String(formData.get('title') ?? ''),
    description: String(formData.get('description') ?? ''),
    image: String(formData.get('image') ?? ''),
    priority: formData.get('priority') ?? 0,
    isActive: formData.get('isActive') === 'on' || formData.get('isActive') === 'true',
  });

  return {
    title: parsed.title,
    description: parsed.description || null,
    image: parsed.image || null,
    priority: parsed.priority,
    isActive: parsed.isActive,
  };
}

export async function listAdminOffers(params: { search?: string; page: number; limit: number }) {
  const where: Prisma.OfferWhereInput = {};

  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.offer.count({ where }),
  ]);

  return {
    items: items.map((offer) => ({
      id: offer.id,
      title: offer.title,
      description: offer.description,
      image: offer.image,
      priority: offer.priority,
      isActive: offer.isActive,
      updatedAt: offer.updatedAt.toISOString(),
    })),
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.limit)),
    },
  };
}

export async function createOffer(input: ReturnType<typeof parseOfferForm>) {
  return prisma.offer.create({ data: input });
}

export async function deleteOffer(id: string) {
  await prisma.offer.delete({ where: { id } });
}
