import { cache } from 'react';

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

function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;

  if (!configuredUrl) {
    return 'http://127.0.0.1:3000';
  }

  if (configuredUrl.startsWith('http')) {
    return configuredUrl;
  }

  return `https://${configuredUrl}`;
}

export const getPublicContent = cache(async (): Promise<PublicContentResponse> => {
  const response = await fetch(`${getApiBaseUrl()}/api/public`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error('Unable to load public content');
  }

  const payload = (await response.json()) as { success?: boolean; data?: PublicContentResponse; error?: { message?: string } };

  if (!payload.success || !payload.data) {
    throw new Error(payload.error?.message || 'Unable to load public content');
  }

  return payload.data;
});
