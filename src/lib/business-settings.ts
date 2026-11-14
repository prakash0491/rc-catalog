import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { isSafeWebLink } from '@/lib/safe-url';

const optionalSafeLink = z
  .string()
  .trim()
  .optional()
  .default('')
  .refine((value) => !value || isSafeWebLink(value), 'Enter a valid http(s) URL or internal path.');

export const businessSettingsSchema = z.object({
  businessName: z.string().trim().min(2, 'Business name is required.'),
  logo: optionalSafeLink,
  phone: z.string().trim().optional().default(''),
  email: z.string().trim().email('Email must be valid.').optional().or(z.literal('')).default(''),
  whatsapp: z.string().trim().optional().default(''),
  instagram: optionalSafeLink,
  facebook: optionalSafeLink,
  youtube: optionalSafeLink,
  address: z.string().trim().optional().default(''),
  businessHours: z.string().trim().optional().default(''),
  seoTitle: z.string().trim().max(160).optional().default(''),
  seoDescription: z.string().trim().optional().default(''),
});

export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;

function emptyToNull(value: string) {
  return value.trim() || null;
}

export function parseBusinessSettingsForm(formData: FormData): BusinessSettingsInput {
  return businessSettingsSchema.parse({
    businessName: String(formData.get('businessName') ?? ''),
    logo: String(formData.get('logo') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    email: String(formData.get('email') ?? ''),
    whatsapp: String(formData.get('whatsapp') ?? ''),
    instagram: String(formData.get('instagram') ?? ''),
    facebook: String(formData.get('facebook') ?? ''),
    youtube: String(formData.get('youtube') ?? ''),
    address: String(formData.get('address') ?? ''),
    businessHours: String(formData.get('businessHours') ?? ''),
    seoTitle: String(formData.get('seoTitle') ?? ''),
    seoDescription: String(formData.get('seoDescription') ?? ''),
  });
}

export async function getBusinessSettingsForEdit() {
  return prisma.businessSettings.findFirst({
    orderBy: { createdAt: 'asc' },
  });
}

export async function upsertBusinessSettings(input: BusinessSettingsInput) {
  const existing = await getBusinessSettingsForEdit();
  const data = {
    businessName: input.businessName,
    logo: emptyToNull(input.logo),
    phone: emptyToNull(input.phone),
    email: emptyToNull(input.email),
    whatsapp: emptyToNull(input.whatsapp),
    instagram: emptyToNull(input.instagram),
    facebook: emptyToNull(input.facebook),
    youtube: emptyToNull(input.youtube),
    address: emptyToNull(input.address),
    businessHours: emptyToNull(input.businessHours),
    seoTitle: emptyToNull(input.seoTitle),
    seoDescription: emptyToNull(input.seoDescription),
  };

  if (existing) {
    return prisma.businessSettings.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.businessSettings.create({ data });
}
