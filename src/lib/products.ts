import { Prisma, StockStatus } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  featured: boolean;
  newArrival: boolean;
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock';
  tags: string[];
}

export type ProductSortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'name-asc';

export type PublicProductListParams = {
  search?: string;
  category?: string;
  sort?: ProductSortOption;
  page: number;
  limit: number;
};

export type PublicProductListItem = Product & {
  categoryName: string;
  categorySlug: string;
};

type ProductRecord = Prisma.ProductGetPayload<{
  include: {
    category: true;
    images: {
      orderBy: { sortOrder: 'asc' };
    };
  };
}>;

function mapStockStatus(status: StockStatus): Product['stockStatus'] {
  if (status === 'LOW_STOCK') {
    return 'low-stock';
  }

  if (status === 'OUT_OF_STOCK') {
    return 'out-of-stock';
  }

  return 'in-stock';
}

function mapProduct(product: ProductRecord): Product {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    price: Number(product.price),
    category: product.category.slug,
    images: product.images.map((image) => image.url),
    featured: product.featured,
    newArrival: product.newArrival,
    stockStatus: mapStockStatus(product.stockStatus),
    tags: [],
  };
}

async function findProductRecordBySlug(slug: string) {
  return prisma.product.findFirst({
    where: {
      slug,
      isActive: true,
    },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
}

async function findRelatedProductRecords(categoryId: string, excludeId: string, limit = 4) {
  return prisma.product.findMany({
    where: {
      categoryId,
      id: { not: excludeId },
      isActive: true,
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
}

export async function getPublicProductBySlug(slug: string): Promise<Product | null> {
  const product = await findProductRecordBySlug(slug);

  return product ? mapProduct(product) : null;
}

export async function getPublicRelatedProducts(productId: string, categoryId: string, limit = 4): Promise<Product[]> {
  const products = await findRelatedProductRecords(categoryId, productId, limit);
  return products.map(mapProduct);
}

export async function getPublicProductPageData(slug: string) {
  const productRecord = await findProductRecordBySlug(slug);

  if (!productRecord) {
    return null;
  }

  const [product, relatedProducts] = await Promise.all([
    Promise.resolve(mapProduct(productRecord)),
    findRelatedProductRecords(productRecord.categoryId, productRecord.id).then((items) => items.map(mapProduct)),
  ]);

  return {
    product,
    relatedProducts,
  };
}

function mapListProduct(product: Prisma.ProductGetPayload<{
  select: {
    id: true;
    slug: true;
    name: true;
    shortDescription: true;
    description: true;
    price: true;
    featured: true;
    newArrival: true;
    stockStatus: true;
    category: {
      select: {
        name: true;
        slug: true;
      };
    };
    images: {
      select: {
        url: true;
      };
    };
  };
}>): PublicProductListItem {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    price: Number(product.price),
    category: product.category.slug,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    images: product.images.length > 0 ? product.images.map((image) => image.url) : ['/images/placeholder.svg'],
    featured: product.featured,
    newArrival: product.newArrival,
    stockStatus: mapStockStatus(product.stockStatus),
    tags: [],
  };
}

function getProductOrderBy(sort: ProductSortOption | undefined): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'featured':
      return [{ featured: 'desc' }, { createdAt: 'desc' }];
    case 'price-asc':
      return [{ price: 'asc' }, { createdAt: 'desc' }];
    case 'price-desc':
      return [{ price: 'desc' }, { createdAt: 'desc' }];
    case 'name-asc':
      return [{ name: 'asc' }];
    case 'newest':
    default:
      return [{ createdAt: 'desc' }];
  }
}

export async function getPublicFeaturedProducts(limit = 6): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      featured: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      slug: true,
      name: true,
      shortDescription: true,
      description: true,
      price: true,
      featured: true,
      newArrival: true,
      stockStatus: true,
      category: {
        select: {
          slug: true,
        },
      },
      images: {
        orderBy: { sortOrder: 'asc' },
        take: 1,
        select: {
          url: true,
        },
      },
    },
  });

  return products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    price: Number(product.price),
    category: product.category.slug,
    images: product.images.length > 0 ? product.images.map((image) => image.url) : ['/images/placeholder.svg'],
    featured: product.featured,
    newArrival: product.newArrival,
    stockStatus: mapStockStatus(product.stockStatus),
    tags: [],
  }));
}

export async function listPublicProductCategories() {
  return prisma.category.findMany({
    where: {
      isActive: true,
      products: {
        some: { isActive: true },
      },
    },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      _count: {
        select: {
          products: {
            where: { isActive: true },
          },
        },
      },
    },
  });
}

export async function getPublicCategoryBySlug(slug: string) {
  return prisma.category.findFirst({
    where: {
      slug,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
    },
  });
}

export async function listPublicProducts(params: PublicProductListParams) {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
  };

  if (params.category) {
    where.category = {
      slug: params.category,
      isActive: true,
    };
  }

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { shortDescription: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const [items, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: getProductOrderBy(params.sort),
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      select: {
        id: true,
        slug: true,
        name: true,
        shortDescription: true,
        description: true,
        price: true,
        featured: true,
        newArrival: true,
        stockStatus: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
          select: {
            url: true,
          },
        },
      },
    }),
    prisma.product.count({ where }),
    listPublicProductCategories(),
  ]);

  return {
    items: items.map(mapListProduct),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      productCount: category._count.products,
    })),
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.limit)),
    },
  };
}
