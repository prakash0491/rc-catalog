export interface HeroContent {
  id: string;
  headline: string;
  subheadline: string;
  primaryCta: {
    label: string;
    href: string;
  };
  secondaryCta: {
    label: string;
    href: string;
  };
  image: {
    src: string;
    alt: string;
  };
}

export const heroContent: HeroContent = {
  id: 'hero-home',
  headline: 'Discover products that feel thoughtfully curated',
  subheadline:
    'A polished catalog experience designed to present products clearly and convert with confidence.',
  primaryCta: {
    label: 'Explore collection',
    href: '/products',
  },
  secondaryCta: {
    label: 'Learn more',
    href: '/about',
  },
  image: {
    src: '/images/hero-placeholder.jpg',
    alt: 'A modern product showcase display',
  },
};
