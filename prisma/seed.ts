import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

import { prisma } from '../src/lib/prisma';

const categories = [
  {
    id: 'cat-home',
    name: 'Home',
    slug: 'home',
    description: 'Refined essentials for calm, functional living spaces.',
    image: '/images/categories/home.jpg',
  },
  {
    id: 'cat-travel',
    name: 'Travel',
    slug: 'travel',
    description: 'Thoughtful carry goods for commuting and travel.',
    image: '/images/categories/travel.jpg',
  },
  {
    id: 'cat-tech',
    name: 'Tech',
    slug: 'tech',
    description: 'Minimal, practical accessories for modern devices.',
    image: '/images/categories/tech.jpg',
  },
  {
    id: 'cat-furniture',
    name: 'Furniture',
    slug: 'furniture',
    description: 'Sculptural furniture pieces with everyday comfort.',
    image: '/images/categories/furniture.jpg',
  },
  {
    id: 'cat-accessories',
    name: 'Accessories',
    slug: 'accessories',
    description: 'Clean, versatile accessories for daily use.',
    image: '/images/categories/accessories.jpg',
  },
  {
    id: 'cat-outdoor',
    name: 'Outdoor',
    slug: 'outdoor',
    description: 'Durable items designed for movement and hydration.',
    image: '/images/categories/outdoor.jpg',
  },
  {
    id: 'cat-fashion',
    name: 'Fashion',
    slug: 'fashion',
    description: 'Modern apparel with a clean, wearable silhouette.',
    image: '/images/categories/fashion.jpg',
  },
] as const;

const products = [
  {
    id: 'prod-aurora-lamp',
    name: 'Aurora Lamp',
    slug: 'aurora-lamp',
    shortDescription: 'A sculptural lamp with warm ambient light.',
    description: 'A minimalist lighting centerpiece designed to bring warmth and balance to any room.',
    price: new Prisma.Decimal('129.00'),
    categoryId: 'cat-home',
    featured: true,
    newArrival: true,
    stockStatus: 'IN_STOCK' as const,
    images: [
      { id: 'img-aurora-1', url: '/images/products/aurora-lamp-1.jpg', alt: 'Aurora Lamp front view', sortOrder: 0 },
      { id: 'img-aurora-2', url: '/images/products/aurora-lamp-2.jpg', alt: 'Aurora Lamp detail view', sortOrder: 1 },
    ],
  },
  {
    id: 'prod-atlas-backpack',
    name: 'Atlas Backpack',
    slug: 'atlas-backpack',
    shortDescription: 'Structured everyday carry with refined details.',
    description: 'A versatile backpack that blends utility, comfort, and understated design.',
    price: new Prisma.Decimal('89.00'),
    categoryId: 'cat-travel',
    featured: true,
    newArrival: false,
    stockStatus: 'IN_STOCK' as const,
    images: [
      { id: 'img-atlas-1', url: '/images/products/atlas-backpack-1.jpg', alt: 'Atlas Backpack front view', sortOrder: 0 },
    ],
  },
  {
    id: 'prod-lumen-speaker',
    name: 'Lumen Speaker',
    slug: 'lumen-speaker',
    shortDescription: 'Compact sound with premium finish.',
    description: 'A sleek portable speaker delivering rich audio in a compact footprint.',
    price: new Prisma.Decimal('149.00'),
    categoryId: 'cat-tech',
    featured: false,
    newArrival: true,
    stockStatus: 'LOW_STOCK' as const,
    images: [
      { id: 'img-lumen-1', url: '/images/products/lumen-speaker-1.jpg', alt: 'Lumen Speaker front view', sortOrder: 0 },
    ],
  },
  {
    id: 'prod-solace-mug',
    name: 'Solace Mug',
    slug: 'solace-mug',
    shortDescription: 'Comfort-first ceramic mug for daily rituals.',
    description: 'A smooth ceramic mug designed for slow mornings and lingering conversations.',
    price: new Prisma.Decimal('24.00'),
    categoryId: 'cat-home',
    featured: false,
    newArrival: false,
    stockStatus: 'IN_STOCK' as const,
    images: [
      { id: 'img-solace-1', url: '/images/products/solace-mug-1.jpg', alt: 'Solace Mug front view', sortOrder: 0 },
    ],
  },
  {
    id: 'prod-cove-chair',
    name: 'Cove Chair',
    slug: 'cove-chair',
    shortDescription: 'A sculptural chair with balanced comfort.',
    description: 'A modern accent chair with a supportive shape and refined silhouette.',
    price: new Prisma.Decimal('219.00'),
    categoryId: 'cat-furniture',
    featured: true,
    newArrival: false,
    stockStatus: 'IN_STOCK' as const,
    images: [
      { id: 'img-cove-1', url: '/images/products/cove-chair-1.jpg', alt: 'Cove Chair front view', sortOrder: 0 },
    ],
  },
  {
    id: 'prod-echo-jar',
    name: 'Echo Jar',
    slug: 'echo-jar',
    shortDescription: 'Elegant storage for everyday essentials.',
    description: 'An understated storage jar with timeless form and practical everyday use.',
    price: new Prisma.Decimal('34.00'),
    categoryId: 'cat-home',
    featured: false,
    newArrival: true,
    stockStatus: 'IN_STOCK' as const,
    images: [
      { id: 'img-echo-1', url: '/images/products/echo-jar-1.jpg', alt: 'Echo Jar front view', sortOrder: 0 },
    ],
  },
  {
    id: 'prod-nova-watch',
    name: 'Nova Watch',
    slug: 'nova-watch',
    shortDescription: 'A sleek everyday watch with premium finish.',
    description: 'A minimalist timepiece that pairs a refined look with everyday wearability.',
    price: new Prisma.Decimal('179.00'),
    categoryId: 'cat-accessories',
    featured: true,
    newArrival: false,
    stockStatus: 'IN_STOCK' as const,
    images: [
      { id: 'img-nova-1', url: '/images/products/nova-watch-1.jpg', alt: 'Nova Watch front view', sortOrder: 0 },
    ],
  },
  {
    id: 'prod-harbor-bottle',
    name: 'Harbor Bottle',
    slug: 'harbor-bottle',
    shortDescription: 'A durable bottle designed for daily movement.',
    description: 'A refined bottle made for commute, travel, and hydration on the go.',
    price: new Prisma.Decimal('39.00'),
    categoryId: 'cat-outdoor',
    featured: false,
    newArrival: true,
    stockStatus: 'IN_STOCK' as const,
    images: [
      { id: 'img-harbor-1', url: '/images/products/harbor-bottle-1.jpg', alt: 'Harbor Bottle front view', sortOrder: 0 },
    ],
  },
  {
    id: 'prod-trace-blanket',
    name: 'Trace Blanket',
    slug: 'trace-blanket',
    shortDescription: 'Soft texture with a clean, modern drape.',
    description: 'A tactile blanket made to create comfort without visual clutter.',
    price: new Prisma.Decimal('79.00'),
    categoryId: 'cat-home',
    featured: false,
    newArrival: false,
    stockStatus: 'LOW_STOCK' as const,
    images: [
      { id: 'img-trace-1', url: '/images/products/trace-blanket-1.jpg', alt: 'Trace Blanket front view', sortOrder: 0 },
    ],
  },
  {
    id: 'prod-summit-hoodie',
    name: 'Summit Hoodie',
    slug: 'summit-hoodie',
    shortDescription: 'Everyday comfort with premium structure.',
    description: 'A versatile knit layer made for calm, comfortable daily wear.',
    price: new Prisma.Decimal('92.00'),
    categoryId: 'cat-fashion',
    featured: true,
    newArrival: false,
    stockStatus: 'IN_STOCK' as const,
    images: [
      { id: 'img-summit-1', url: '/images/products/summit-hoodie-1.jpg', alt: 'Summit Hoodie front view', sortOrder: 0 },
    ],
  },
  {
    id: 'prod-rift-stand',
    name: 'Rift Stand',
    slug: 'rift-stand',
    shortDescription: 'A clean desktop stand for everyday tech.',
    description: 'A purposeful stand that supports devices with a compact, elegant profile.',
    price: new Prisma.Decimal('54.00'),
    categoryId: 'cat-tech',
    featured: false,
    newArrival: true,
    stockStatus: 'IN_STOCK' as const,
    images: [
      { id: 'img-rift-1', url: '/images/products/rift-stand-1.jpg', alt: 'Rift Stand front view', sortOrder: 0 },
    ],
  },
  {
    id: 'prod-velo-bag',
    name: 'Velo Bag',
    slug: 'velo-bag',
    shortDescription: 'Refined everyday carry for work and weekend.',
    description: 'A streamlined bag featuring thoughtful organization and durable construction.',
    price: new Prisma.Decimal('114.00'),
    categoryId: 'cat-accessories',
    featured: false,
    newArrival: false,
    stockStatus: 'OUT_OF_STOCK' as const,
    images: [
      { id: 'img-velo-1', url: '/images/products/velo-bag-1.jpg', alt: 'Velo Bag front view', sortOrder: 0 },
    ],
  },
] as const;

const offers = [
  {
    id: 'offer-summer-edit',
    title: 'Summer edit',
    description: 'Seasonal picks curated for warm-weather essentials.',
    image: '/images/offers/summer-edit.jpg',
    priority: 1,
    isActive: true,
    startDate: new Date('2026-06-01T00:00:00.000Z'),
    endDate: new Date('2026-08-31T23:59:59.999Z'),
  },
  {
    id: 'offer-new-arrivals',
    title: 'New arrivals',
    description: 'Fresh inventory highlighted for quick browsing.',
    image: '/images/offers/new-arrivals.jpg',
    priority: 2,
    isActive: true,
    startDate: null,
    endDate: null,
  },
] as const;

const businessSettings = {
  id: 'business-default',
  businessName: 'VISH GARAGE',
  logo: '/images/logo.svg',
  phone: '+1 555 0100',
  email: 'hello@rccatalog.com',
  whatsapp: '+15550100',
  instagram: 'https://instagram.com/rccatalog',
  facebook: 'https://facebook.com/rccatalog',
  youtube: 'https://youtube.com/@rccatalog',
  address: '123 Market Street, San Francisco, CA',
  businessHours: 'Mon-Sat 9:00 AM - 6:00 PM',
  seoTitle: 'VISH GARAGE',
  seoDescription: 'A reusable product catalog platform built for modern commerce.',
} as const;

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email && !password) {
    return;
  }

  if (!email || !password) {
    console.warn('Skipping admin seed: set both SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD.');
    return;
  }

  if (password.length < 8) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 8 characters.');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.admin.upsert({
    where: { email },
    create: { email, name: 'Store Admin', passwordHash },
    update: { passwordHash },
  });

  console.log(`Admin account ready: ${email}`);
}

async function main() {
  await prisma.$transaction([
    prisma.productImage.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.offer.deleteMany(),
    prisma.businessSettings.deleteMany(),
  ]);

  await prisma.category.createMany({ data: [...categories] });
  await prisma.product.createMany({
    data: products.map(({ images, ...product }) => {
      void images;
      return product;
    }),
  });

  await prisma.productImage.createMany({
    data: products.flatMap((product) =>
      product.images.map((image) => ({
        id: image.id,
        productId: product.id,
        url: image.url,
        alt: image.alt,
        sortOrder: image.sortOrder,
      }))
    ),
  });

  await prisma.offer.createMany({ data: [...offers] });
  await prisma.businessSettings.create({ data: businessSettings });
  await seedAdmin();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
