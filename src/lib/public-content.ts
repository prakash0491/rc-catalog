import { cache } from 'react';

import { prisma } from '@/lib/prisma';
import { getActiveHeroBanner } from '@/lib/banners';
import {
  businessProfile as mockBusinessProfile,
  faqs as mockFaqs,
  faqCategories as mockFaqCategories,
  seoConfig as mockSeoConfig,
} from '@/mock';

export interface PublicContentResponse {
  businessProfile: {
    id: string;
    name: string;
    tagline: string;
    description: string;
    email: string;
    phone: string;
    whatsapp: string;
    address: string;
    openingHours: string;
    socialLinks: Array<{ platform: string; url: string }>;
    mission?: string;
    vision?: string;
    story?: string;
    whyChooseUs?: Array<{ title: string; description: string }>;
    stats?: Array<{ value: string; label: string }>;
    timeline?: Array<{ year: string; title: string; description: string }>;
    aboutCta?: { title: string; description: string };
  };
  heroBanner: {
    id: string;
    title: string;
    subtitle?: string | null;
    image: string;
    buttonText?: string | null;
    buttonUrl?: string | null;
  } | null;
  offers: Array<{
    id: string;
    title: string;
    description?: string | null;
    image?: string | null;
    priority: number;
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    image: string;
    shortDescription: string;
    description: string;
  }>;
  faqs: Array<{ id: string; question: string; answer: string; category: string }>;
  faqCategories: Array<{ id: string; name: string; slug: string }>;
  seo: {
    title: string;
    description: string;
    url: string;
  };
}

function buildFallbackPublicContent(): PublicContentResponse {
  return {
    businessProfile: mockBusinessProfile,
    heroBanner: null,
    offers: [],
    categories: [],
    faqs: mockFaqs,
    faqCategories: mockFaqCategories,
    seo: {
      title: mockBusinessProfile.name,
      description: mockBusinessProfile.description,
      url: mockSeoConfig.canonicalBaseUrl,
    },
  };
}

export const getPublicContent = cache(async (): Promise<PublicContentResponse> => {
  try {
    const now = new Date();
    const [businessSettings, heroBanner, offers, categories] = await Promise.all([
      prisma.businessSettings.findFirst({
        orderBy: { createdAt: 'asc' },
      }),
      getActiveHeroBanner(),
      prisma.offer.findMany({
        where: {
          isActive: true,
          AND: [
            { OR: [{ startDate: null }, { startDate: { lte: now } }] },
            { OR: [{ endDate: null }, { endDate: { gte: now } }] },
          ],
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: 4,
        select: {
          id: true,
          title: true,
          description: true,
          image: true,
          priority: true,
        },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          image: true,
          isActive: true,
        },
      }),
    ]);

    const settings = businessSettings;
    const businessProfile = {
      id: settings?.id ?? 'business-profile',
      name: settings?.businessName ?? 'VISH GARAGE',
      tagline: 'Curated products for modern living',
      description: settings?.seoDescription ?? 'A flexible commerce platform designed to showcase products with clarity, trust, and modern presentation.',
      email: settings?.email ?? 'hello@northstarcommerce.com',
      phone: settings?.phone ?? '+1-555-0100',
      whatsapp: settings?.whatsapp ?? '+91',
      address: settings?.address ?? '123 Market Street, Suite 400, New York, NY 10001',
      openingHours: settings?.businessHours ?? 'Mon–Fri: 9:00 AM – 6:00 PM',
      socialLinks: [
        { platform: 'Instagram', url: settings?.instagram ?? 'https://instagram.com' },
        { platform: 'Facebook', url: settings?.facebook ?? 'https://facebook.com' },
        { platform: 'YouTube', url: settings?.youtube ?? 'https://youtube.com' },
      ],
      mission: 'To create a calm, premium shopping experience that helps customers discover products with confidence and clarity.',
      vision: 'To become the most trusted local destination for carefully curated products and thoughtful customer support.',
      story: 'VISH GARAGE brings curated products, clear storytelling, and dependable service together in one refined experience.',
      whyChooseUs: [
        { title: 'Editorial quality', description: 'Every product page is shaped around clarity, trust, and thoughtful details.' },
        { title: 'Thoughtful support', description: 'Customers can connect instantly through WhatsApp and email.' },
        { title: 'Flexible presentation', description: 'The platform supports growth without rework.' },
      ],
      stats: [
        { value: '24/7', label: 'Inquiry readiness' },
        { value: '98%', label: 'Customer satisfaction' },
        { value: '12+', label: 'Curated categories' },
      ],
      timeline: [
        { year: '2021', title: 'Platform launch', description: 'The first storefront experience introduced a polished catalog and modern storytelling.' },
        { year: '2023', title: 'Expanded content', description: 'New product pages and richer journeys were added.' },
        { year: '2026', title: 'Premium experience', description: 'The current experience combines visual elegance and responsive support.' },
      ],
      aboutCta: {
        title: 'Ready to explore the catalog?',
        description: 'Browse products and get in touch for personalized recommendations.',
      },
    };

    return {
      businessProfile,
      heroBanner,
      offers,
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        image: category.image ?? '/images/placeholder.svg',
        shortDescription: category.description ?? 'A curated collection for modern needs.',
        description: category.description ?? 'A curated collection for modern needs.',
      })),
      faqs: mockFaqs,
      faqCategories: mockFaqCategories,
      seo: {
        title: settings?.seoTitle ?? businessProfile.name,
        description: settings?.seoDescription ?? businessProfile.description,
        url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com',
      },
    };
  } catch {
    return buildFallbackPublicContent();
  }
});
