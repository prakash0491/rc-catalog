export interface NavItem {
  id: string;
  label: string;
  href: string;
  external?: boolean;
}

export interface NavigationConfig {
  primary: NavItem[];
  footer: NavItem[];
}

export const navigationConfig: NavigationConfig = {
  primary: [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'products', label: 'Products', href: '/products' },
    { id: 'categories', label: 'Categories', href: '/categories' },
    { id: 'about', label: 'About', href: '/about' },
    { id: 'contact', label: 'Contact', href: '/contact' },
  ],
  footer: [
    { id: 'products-footer', label: 'Products', href: '/products' },
    { id: 'categories-footer', label: 'Categories', href: '/categories' },
    { id: 'faq-footer', label: 'FAQ', href: '/faq' },
    { id: 'contact-footer', label: 'Contact', href: '/contact' },
  ],
};
