export interface Category {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  image: string;
  featured?: boolean;
}

export const categories: Category[] = [
  {
    id: 'cat-home',
    slug: 'home',
    name: 'Home Essentials',
    shortDescription: 'Functional and thoughtful pieces for everyday living.',
    image: '/images/categories/home.jpg',
    featured: true,
  },
  {
    id: 'cat-tech',
    slug: 'tech',
    name: 'Technology',
    shortDescription: 'Modern tools designed to simplify everyday routines.',
    image: '/images/categories/tech.jpg',
  },
  {
    id: 'cat-wellness',
    slug: 'wellness',
    name: 'Wellness',
    shortDescription: 'Elevated essentials for comfort and personal care.',
    image: '/images/categories/wellness.jpg',
  },
  {
    id: 'cat-outdoor',
    slug: 'outdoor',
    name: 'Outdoor Living',
    shortDescription: 'Built for travel, leisure, and everyday escapes.',
    image: '/images/categories/outdoor.jpg',
  },
];
