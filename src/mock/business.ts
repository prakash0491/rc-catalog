export interface BusinessProfile {
  id: string;
  name: string;
  tagline: string;
  description: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  openingHours: string;
  socialLinks: {
    platform: string;
    url: string;
  }[];
  mission?: string;
  vision?: string;
  story?: string;
  whyChooseUs?: Array<{
    title: string;
    description: string;
  }>;
  stats?: Array<{
    value: string;
    label: string;
  }>;
  timeline?: Array<{
    year: string;
    title: string;
    description: string;
  }>;
  aboutCta?: {
    title: string;
    description: string;
  };
}

export const businessProfile: BusinessProfile = {
  id: 'business-profile',
  name: 'Northstar Commerce',
  tagline: 'Curated products for modern living',
  description:
    'A flexible commerce platform designed to showcase products with clarity, trust, and modern presentation.',
  email: 'hello@northstarcommerce.com',
  phone: '+1-555-0100',
  whatsapp: '+15550100',
  address: '123 Market Street, Suite 400, New York, NY 10001',
  openingHours: 'Mon–Fri: 9:00 AM – 6:00 PM',
  socialLinks: [
    { platform: 'Instagram', url: 'https://instagram.com' },
    { platform: 'Facebook', url: 'https://facebook.com' },
    { platform: 'YouTube', url: 'https://youtube.com' },
  ],
  mission: 'To create a calm, premium shopping experience that helps customers discover products with confidence and clarity.',
  vision: 'To become the most trusted local destination for carefully curated products and thoughtful customer support.',
  story:
    'Northstar Commerce began as a simple idea: bring refined product storytelling, beautiful presentation, and dependable service together in one place. Over time, the platform evolved into a flexible storefront experience that balances elegance with clarity.',
  whyChooseUs: [
    {
      title: 'Editorial quality',
      description: 'Every product page is shaped around clarity, trust, and thoughtful details.',
    },
    {
      title: 'Thoughtful support',
      description: 'Customers can connect instantly with a human-first experience through WhatsApp and email.',
    },
    {
      title: 'Flexible presentation',
      description: 'The platform is built to support new categories, products, and future growth without rework.',
    },
  ],
  stats: [
    { value: '24/7', label: 'Inquiry readiness' },
    { value: '98%', label: 'Customer satisfaction' },
    { value: '12+', label: 'Curated categories' },
  ],
  timeline: [
    {
      year: '2021',
      title: 'Platform launch',
      description: 'The first storefront experience introduced a polished catalog and modern storytelling.',
    },
    {
      year: '2023',
      title: 'Expanded content',
      description: 'New product pages, richer case studies, and improved support journeys were added.',
    },
    {
      year: '2026',
      title: 'Premium experience',
      description: 'The current experience combines visual elegance, accessibility, and responsive design.',
    },
  ],
  aboutCta: {
    title: 'Ready to explore the catalog?',
    description: 'Discover thoughtfully curated products and get in touch for recommendations.',
  },
};
