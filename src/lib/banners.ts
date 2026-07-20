import { Banner, Prisma } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

export const ADMIN_BANNERS_PAGE_SIZE = 10;

export type AdminBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  buttonText: string | null;
  buttonUrl: string | null;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PublicHeroBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  buttonText: string | null;
  buttonUrl: string | null;
};

export const bannerFormSchema = z.object({
  title: z.string().trim().min(2, 'Title is required.').max(160, 'Title must be 160 characters or fewer.'),
  subtitle: z.string().trim().optional().default(''),
  image: z.string().trim().url('Upload a Cloudinary image before saving.'),
  buttonText: z.string().trim().max(80, 'Button text must be 80 characters or fewer.').optional().default(''),
  buttonUrl: z
    .string()
    .trim()
    .optional()
    .default('')
    .refine((value) => !value || value.startsWith('/') || z.string().url().safeParse(value).success, {
      message: 'Button URL must be an internal path or a valid URL.',
    }),
  priority: z.coerce.number().int().min(0, 'Priority must be zero or greater.').optional().default(0),
  isActive: z.coerce.boolean().optional().default(true),
});

export type BannerFormInput = z.infer<typeof bannerFormSchema>;

type BannerWriteInput = {
  title: string;
  subtitle: string | null;
  image: string;
  buttonText: string | null;
  buttonUrl: string | null;
  priority: number;
  isActive: boolean;
};

function normalizeBannerInput(input: BannerFormInput): BannerWriteInput {
  return {
    title: input.title.trim(),
    subtitle: input.subtitle.trim() || null,
    image: input.image.trim(),
    buttonText: input.buttonText.trim() || null,
    buttonUrl: input.buttonUrl.trim() || null,
    priority: input.priority,
    isActive: input.isActive,
  };
}

export function parseBannerForm(formData: FormData): BannerWriteInput {
  return normalizeBannerInput(
    bannerFormSchema.parse({
      title: String(formData.get('title') ?? ''),
      subtitle: String(formData.get('subtitle') ?? ''),
      image: String(formData.get('image') ?? ''),
      buttonText: String(formData.get('buttonText') ?? ''),
      buttonUrl: String(formData.get('buttonUrl') ?? ''),
      priority: formData.get('priority') ?? 0,
      isActive: formData.get('isActive') === 'on' || formData.get('isActive') === 'true',
    })
  );
}

export function serializeAdminBanner(banner: Banner): AdminBanner {
  return {
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle,
    image: banner.image,
    buttonText: banner.buttonText,
    buttonUrl: banner.buttonUrl,
    priority: banner.priority,
    isActive: banner.isActive,
    createdAt: banner.createdAt.toISOString(),
    updatedAt: banner.updatedAt.toISOString(),
  };
}

export function serializePublicHeroBanner(banner: Banner): PublicHeroBanner {
  return {
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle,
    image: banner.image,
    buttonText: banner.buttonText,
    buttonUrl: banner.buttonUrl,
  };
}

export async function listAdminBanners(params: { search?: string; page: number; limit: number }) {
  const where: Prisma.BannerWhereInput = {};

  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: 'insensitive' } },
      { subtitle: { contains: params.search, mode: 'insensitive' } },
      { buttonText: { contains: params.search, mode: 'insensitive' } },
      { buttonUrl: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.banner.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.banner.count({ where }),
  ]);

  return {
    items: items.map(serializeAdminBanner),
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.limit)),
    },
  };
}

export async function getAdminBannerById(id: string) {
  const banner = await prisma.banner.findUnique({ where: { id } });
  return banner ? serializeAdminBanner(banner) : null;
}

export async function createBanner(input: BannerWriteInput) {
  const banner = await prisma.banner.create({
    data: input,
  });

  return serializeAdminBanner(banner);
}

export async function updateBanner(id: string, input: BannerWriteInput) {
  const existing = await prisma.banner.findUnique({ where: { id }, select: { id: true } });

  if (!existing) {
    return null;
  }

  const banner = await prisma.banner.update({
    where: { id: existing.id },
    data: input,
  });

  return serializeAdminBanner(banner);
}

export async function updateBannerActiveState(id: string, isActive: boolean) {
  const existing = await prisma.banner.findUnique({ where: { id }, select: { id: true } });

  if (!existing) {
    return null;
  }

  const banner = await prisma.banner.update({
    where: { id: existing.id },
    data: { isActive },
  });

  return serializeAdminBanner(banner);
}

export async function deleteBanner(id: string) {
  const existing = await prisma.banner.findUnique({ where: { id }, select: { id: true } });

  if (!existing) {
    return false;
  }

  await prisma.banner.delete({ where: { id: existing.id } });
  return true;
}

export async function getActiveHeroBanner() {
  const banner = await prisma.banner.findFirst({
    where: { isActive: true },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });

  return banner ? serializePublicHeroBanner(banner) : null;
}
