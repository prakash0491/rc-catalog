export interface SeoConfig {
  siteName: string;
  defaultTitle: string;
  description: string;
  keywords: string[];
  ogImage: string;
  twitterImage: string;
  canonicalBaseUrl: string;
}

export const seoConfig: SeoConfig = {
  siteName: 'Northstar Commerce',
  defaultTitle: 'Modern Product Catalog',
  description: 'A reusable product catalog platform for showcasing products with elegance and clarity.',
  keywords: ['catalog', 'products', 'storefront', 'modern commerce', 'ecommerce'],
  ogImage: '/images/og-image.jpg',
  twitterImage: '/images/twitter-image.jpg',
  canonicalBaseUrl: 'https://example.com',
};
