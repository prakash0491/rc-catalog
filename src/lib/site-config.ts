export const siteConfig = {
  brandName: 'Your Brand',
  tagline: 'A flexible, reusable product catalog experience.',
  navItems: [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Categories', href: '/categories' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  footerLinks: [
    { label: 'Products', href: '/products' },
    { label: 'Categories', href: '/categories' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  socialLinks: [
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'Facebook', href: 'https://facebook.com' },
    { label: 'YouTube', href: 'https://youtube.com' },
  ],
  contact: {
    email: 'hello@example.com',
    phone: '+1-555-0100',
    address: '123 Market Street, City, Country',
    hours: 'Mon–Fri • 9:00–18:00',
  },
  defaultSeo: {
    title: 'Your Brand',
    description: 'A reusable product catalog platform built for modern commerce.',
    url: 'https://example.com',
  },
} as const;
