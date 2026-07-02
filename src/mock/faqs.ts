export interface FaqCategory {
  id: string;
  name: string;
  slug: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const faqCategories: FaqCategory[] = [
  { id: 'all', name: 'All topics', slug: 'all' },
  { id: 'catalog', name: 'Catalog', slug: 'catalog' },
  { id: 'orders', name: 'Orders', slug: 'orders' },
  { id: 'support', name: 'Support', slug: 'support' },
];

export const faqs: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'How do I browse the catalog?',
    answer: 'Use the navigation menu, category pages, or the search experience to discover products quickly.',
    category: 'catalog',
  },
  {
    id: 'faq-2',
    question: 'Can I request a product recommendation?',
    answer: 'Yes, contact our team for personalized recommendations and support.',
    category: 'support',
  },
  {
    id: 'faq-3',
    question: 'Do you offer shipping?',
    answer: 'Shipping options vary by location and product availability.',
    category: 'orders',
  },
  {
    id: 'faq-4',
    question: 'Are products updated regularly?',
    answer: 'Yes, the catalog is designed to support frequent updates and new arrivals.',
    category: 'catalog',
  },
  {
    id: 'faq-5',
    question: 'Can I view products by category?',
    answer: 'Yes, browse by category to find products grouped by type and purpose.',
    category: 'catalog',
  },
  {
    id: 'faq-6',
    question: 'Are featured products highlighted?',
    answer: 'Featured products are surfaced prominently for easier discovery.',
    category: 'catalog',
  },
  {
    id: 'faq-7',
    question: 'How are new arrivals marked?',
    answer: 'New arrival items are clearly labeled throughout the catalog experience.',
    category: 'catalog',
  },
  {
    id: 'faq-8',
    question: 'Is the catalog mobile-friendly?',
    answer: 'Yes, the platform is designed to provide a smooth experience on mobile and desktop.',
    category: 'support',
  },
  {
    id: 'faq-9',
    question: 'Can this platform be adapted to another business?',
    answer: 'Yes, the content layer is intentionally generic and designed to be swapped or extended later.',
    category: 'support',
  },
  {
    id: 'faq-10',
    question: 'Where can I get support?',
    answer: 'You can reach out via email, phone, or WhatsApp for assistance.',
    category: 'support',
  },
];
