export interface FooterConfig {
  id: string;
  description: string;
  columns: Array<{
    title: string;
    links: Array<{ label: string; href: string }>;
  }>;
}

export const footerConfig: FooterConfig = {
  id: 'footer-config',
  description: 'A modern catalog experience for showcasing products with clarity and confidence.',
  columns: [
    {
      title: 'Explore',
      links: [
        { label: 'Products', href: '/products' },
        { label: 'Categories', href: '/categories' },
        { label: 'Offers', href: '/offers' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '/support' },
        { label: 'Shipping', href: '/shipping' },
        { label: 'Returns', href: '/returns' },
      ],
    },
  ],
};
