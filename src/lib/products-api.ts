export interface ProductImageApiItem {
  id: string;
  url: string;
  alt?: string | null;
  sortOrder: number;
}

export interface CategoryApiItem {
  id: string;
  name: string;
  slug: string;
}

export interface ProductApiItem {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  featured: boolean;
  newArrival: boolean;
  stockStatus: string;
  isActive: boolean;
  category?: CategoryApiItem | null;
  images?: ProductImageApiItem[];
}

export interface ProductListResponse {
  items: ProductApiItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductDetailResponse {
  product: ProductApiItem;
  relatedProducts: ProductApiItem[];
}

export interface ProductUiShape {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  category: string;
  categorySlug?: string;
  featured: boolean;
  newArrival: boolean;
  stockStatus: string;
  images: string[];
  tags: string[];
}

function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;

  if (!configuredUrl) {
    return 'http://127.0.0.1:3000';
  }

  if (configuredUrl.startsWith('http')) {
    return configuredUrl;
  }

  return `https://${configuredUrl}`;
}

async function requestProductsApi<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { success?: boolean; data?: T; error?: { message?: string; code?: string } };

  if (!payload.success || !payload.data) {
    throw new Error(payload.error?.message || 'Unexpected API response');
  }

  return payload.data as T;
}

export function normalizeProductForUi(product: ProductApiItem): ProductUiShape {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    price: Number(product.price),
    category: product.category?.name ?? 'General',
    categorySlug: product.category?.slug,
    featured: product.featured,
    newArrival: product.newArrival,
    stockStatus: product.stockStatus,
    images: product.images?.map((image) => image.url) ?? ['/images/placeholder.svg'],
    tags: [],
  };
}

export async function getProductsList(params?: Record<string, string | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });

  const path = `/api/products${query.toString() ? `?${query.toString()}` : ''}`;
  const data = await requestProductsApi<ProductListResponse>(path);

  return {
    items: data.items.map(normalizeProductForUi),
    pagination: data.pagination,
  };
}

export async function getFeaturedProducts() {
  const data = await requestProductsApi<ProductApiItem[]>('/api/products/featured');
  return data.map(normalizeProductForUi);
}

export async function getNewProducts() {
  const data = await requestProductsApi<ProductApiItem[]>('/api/products/new');
  return data.map(normalizeProductForUi);
}

export async function getProductBySlug(slug: string) {
  const data = await requestProductsApi<ProductDetailResponse>(`/api/products/${encodeURIComponent(slug)}`);
  return {
    product: normalizeProductForUi(data.product),
    relatedProducts: data.relatedProducts.map(normalizeProductForUi),
  };
}
