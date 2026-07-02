export interface Offer {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  badge?: string;
}

export const offers: Offer[] = [
  {
    id: 'offer-spring',
    title: 'Spring Collection Spotlight',
    description: 'Explore fresh arrivals and elevated essentials with curated picks.',
    ctaLabel: 'View offers',
    ctaHref: '/offers',
    badge: 'New',
  },
  {
    id: 'offer-free-shipping',
    title: 'Free Shipping on Select Bundles',
    description: 'Enjoy complimentary delivery on curated bundles and featured collections.',
    ctaLabel: 'Shop bundles',
    ctaHref: '/products',
    badge: 'Limited',
  },
];
