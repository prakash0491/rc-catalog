import { Prisma, ProductStatus, StockStatus } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export interface ProductVariantView {
  id: string;
  optionName: string;
  optionValue: string;
  sku: string | null;
  priceOverride: number | null;
  stockQuantity: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  mrp: number | null;
  discountPercent: number;
  sku: string | null;
  stockQuantity: number;
  category: string;
  images: string[];
  featured: boolean;
  newArrival: boolean;
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock';
  tags: string[];
  specifications: Array<{ name: string; value: string }>;
  variants: ProductVariantView[];
}

export type ProductSortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'name-asc';

export type PublicProductListParams = {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: Product['stockStatus'];
  brand?: string;
  sort?: ProductSortOption;
  page: number;
  limit: number;
};

export type PublicProductListItem = Product & {
  categoryName: string;
  categorySlug: string;
};

const PRODUCT_SORT_OPTIONS = new Set<ProductSortOption>(['featured', 'newest', 'price-asc', 'price-desc', 'name-asc']);

type ProductRecord = Prisma.ProductGetPayload<{
  include: {
    category: true;
    images: {
      orderBy: { sortOrder: 'asc' };
    };
    specifications: {
      orderBy: { sortOrder: 'asc' };
    };
    variants: {
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

type ProductVariantSource = {
  id: string;
  optionName: string;
  optionValue: string;
  sku: string | null;
  priceOverride: Prisma.Decimal | null;
  stockQuantity: number;
};

function mapVariant(variant: ProductVariantSource): ProductVariantView {
  return {
    id: variant.id,
    optionName: variant.optionName,
    optionValue: variant.optionValue,
    sku: variant.sku,
    priceOverride: variant.priceOverride === null ? null : Number(variant.priceOverride),
    stockQuantity: variant.stockQuantity,
  };
}

function mapProduct(product: ProductRecord): Product {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    price: Number(product.price),
    mrp: product.mrp === null ? null : Number(product.mrp),
    discountPercent: product.discountPercent,
    sku: product.sku,
    stockQuantity: product.stockQuantity,
    category: product.category.slug,
    images: product.images.map((image) => image.url),
    featured: product.featured,
    newArrival: product.newArrival,
    stockStatus: mapStockStatus(product.stockStatus),
    tags: [],
    specifications: product.specifications.map((item) => ({ name: item.name, value: item.value })),
    variants: product.variants.map(mapVariant),
  };
}

async function findProductRecordBySlug(slug: string) {
  return prisma.product.findFirst({
    where: {
      slug,
      isActive: true,
      status: ProductStatus.PUBLISHED,
      deletedAt: null,
      category: { isActive: true },
    },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: 'asc' },
      },
      specifications: {
        orderBy: { sortOrder: 'asc' },
      },
      variants: {
        where: { isActive: true },
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
      status: ProductStatus.PUBLISHED,
      deletedAt: null,
      category: { isActive: true },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: 'asc' },
      },
      specifications: {
        orderBy: { sortOrder: 'asc' },
      },
      variants: {
        where: { isActive: true },
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
    mrp: true;
    discountPercent: true;
    sku: true;
    stockQuantity: true;
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
    variants: {
      select: {
        id: true;
        optionName: true;
        optionValue: true;
        sku: true;
        priceOverride: true;
        stockQuantity: true;
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
    mrp: product.mrp === null ? null : Number(product.mrp),
    discountPercent: product.discountPercent,
    sku: product.sku,
    stockQuantity: product.stockQuantity,
    category: product.category.slug,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    images: product.images.length > 0 ? product.images.map((image) => image.url) : ['/images/placeholder.svg'],
    featured: product.featured,
    newArrival: product.newArrival,
    stockStatus: mapStockStatus(product.stockStatus),
    tags: [],
    specifications: [],
    variants: product.variants.map(mapVariant),
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
      status: ProductStatus.PUBLISHED,
      deletedAt: null,
      category: { isActive: true },
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
      mrp: true,
      discountPercent: true,
      sku: true,
      stockQuantity: true,
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
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          optionName: true,
          optionValue: true,
          sku: true,
          priceOverride: true,
          stockQuantity: true,
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
    mrp: product.mrp === null ? null : Number(product.mrp),
    discountPercent: product.discountPercent,
    sku: product.sku,
    stockQuantity: product.stockQuantity,
    category: product.category.slug,
    images: product.images.length > 0 ? product.images.map((image) => image.url) : ['/images/placeholder.svg'],
    featured: product.featured,
    newArrival: product.newArrival,
    stockStatus: mapStockStatus(product.stockStatus),
    tags: [],
    specifications: [],
    variants: product.variants.map(mapVariant),
  }));
}

export async function listPublicProductCategories() {
  return prisma.category.findMany({
    where: {
      isActive: true,
      products: {
        some: { isActive: true, status: ProductStatus.PUBLISHED, deletedAt: null },
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
            where: { isActive: true, status: ProductStatus.PUBLISHED, deletedAt: null },
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
      _count: {
        select: {
          products: {
            where: { isActive: true, status: ProductStatus.PUBLISHED, deletedAt: null },
          },
        },
      },
    },
  });
}

export async function listPublicProducts(params: PublicProductListParams) {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    status: ProductStatus.PUBLISHED,
    deletedAt: null,
    category: { isActive: true },
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

  if (typeof params.minPrice === 'number') {
    where.price = { ...(typeof where.price === 'object' ? where.price : {}), gte: params.minPrice };
  }

  if (typeof params.maxPrice === 'number') {
    where.price = { ...(typeof where.price === 'object' ? where.price : {}), lte: params.maxPrice };
  }

  if (params.availability) {
    const availabilityMap: Record<Product['stockStatus'], StockStatus> = {
      'in-stock': StockStatus.IN_STOCK,
      'low-stock': StockStatus.LOW_STOCK,
      'out-of-stock': StockStatus.OUT_OF_STOCK,
    };
    where.stockStatus = availabilityMap[params.availability];
  }

  if (params.brand) {
    where.specifications = {
      some: {
        name: { equals: 'brand', mode: 'insensitive' },
        value: { contains: params.brand, mode: 'insensitive' },
      },
    };
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
        mrp: true,
        discountPercent: true,
        sku: true,
        stockQuantity: true,
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
        variants: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            optionName: true,
            optionValue: true,
            sku: true,
            priceOverride: true,
            stockQuantity: true,
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

function parseOptionalPrice(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
}

export function parseProductListQuery(
  query: Record<string, string | string[] | undefined>
): {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: Product['stockStatus'];
  brand?: string;
  sort: ProductSortOption;
  page: number;
} {
  const read = (key: string): string | undefined => {
    const value = query[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const search = read('search')?.trim() || undefined;
  const category = read('category')?.trim() || undefined;
  const brand = read('brand')?.trim() || undefined;
  const minPrice = parseOptionalPrice(read('minPrice'));
  const maxPrice = parseOptionalPrice(read('maxPrice'));

  const availabilityRaw = read('availability');
  const availability =
    availabilityRaw === 'in-stock' || availabilityRaw === 'low-stock' || availabilityRaw === 'out-of-stock'
      ? availabilityRaw
      : undefined;

  const sortRaw = read('sort');
  const sort: ProductSortOption =
    sortRaw && PRODUCT_SORT_OPTIONS.has(sortRaw as ProductSortOption) ? (sortRaw as ProductSortOption) : 'featured';

  const pageValue = Number(read('page'));
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1;

  return {
    search,
    category,
    brand,
    minPrice,
    maxPrice,
    availability,
    sort,
    page,
  };
}

export async function getProductSearchSuggestions(query: string, limit = 5) {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        status: ProductStatus.PUBLISHED,
        deletedAt: null,
        category: { isActive: true },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { shortDescription: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
          select: {
            url: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.category.findMany({
      where: {
        isActive: true,
        name: { contains: query, mode: 'insensitive' },
        products: {
          some: { isActive: true, status: ProductStatus.PUBLISHED, deletedAt: null },
        },
      },
      take: 3,
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
      },
    }),
  ]);

  return { products, categories };
}
