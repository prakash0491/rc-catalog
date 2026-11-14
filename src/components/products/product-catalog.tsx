import Image from 'next/image';
import Link from 'next/link';

import {
  BaseCard,
  Breadcrumb,
  EmptyState,
  Heading,
  Input,
  PrimaryButton,
  SecondaryButton,
  Stack,
  Text,
} from '@/components/ui';
import type { ProductSortOption, PublicProductListItem } from '@/lib/products';
import { formatPrice } from '@/lib/money';

import { WishlistButton } from '@/components/product/wishlist-button';

import { DiscoverySearch } from './discovery-search';

type CategoryFilter = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
};

type ProductCatalogProps = {
  products: PublicProductListItem[];
  categories: CategoryFilter[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    availability?: 'in-stock' | 'low-stock' | 'out-of-stock';
    brand?: string;
    sort: ProductSortOption;
  };
  whatsappNumber: string;
  basePath?: string;
  title?: string;
  description?: string;
  image?: string | null;
  productCount?: number;
  breadcrumbItems?: Array<{ label: string; href?: string }>;
  showCategoryFilters?: boolean;
};

function formatStockStatus(status: PublicProductListItem['stockStatus']) {
  if (status === 'in-stock') return 'In stock';
  if (status === 'low-stock') return 'Low stock';
  return 'Out of stock';
}

function buildHref(basePath: string, params: ProductCatalogProps['filters'] & { page?: number }) {
  const query = new URLSearchParams();

  if (params.search) query.set('search', params.search);
  if (params.category) query.set('category', params.category);
  if (typeof params.minPrice === 'number') query.set('minPrice', params.minPrice.toString());
  if (typeof params.maxPrice === 'number') query.set('maxPrice', params.maxPrice.toString());
  if (params.availability) query.set('availability', params.availability);
  if (params.brand) query.set('brand', params.brand);
  if (params.sort && params.sort !== 'featured') query.set('sort', params.sort);
  if (params.page && params.page > 1) query.set('page', params.page.toString());

  const queryString = query.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

function buildSuggestions(products: PublicProductListItem[], categories: CategoryFilter[]) {
  return [
    ...products.map((product) => ({
      label: product.name,
      href: `/products/${product.slug}`,
      type: 'Product' as const,
    })),
    ...categories.map((category) => ({
      label: category.name,
      href: `/categories/${category.slug}`,
      type: 'Category' as const,
    })),
  ];
}

export function ProductCatalog({
  products,
  categories,
  pagination,
  filters,
  whatsappNumber,
  basePath = '/products',
  title = 'Product catalog',
  description = 'Browse a thoughtfully curated collection with filtering, sorting, and a polished experience tailored for modern product discovery.',
  image = null,
  productCount,
  breadcrumbItems = [{ label: 'Home', href: '/' }, { label: 'Products' }],
  showCategoryFilters = true,
}: ProductCatalogProps) {
  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <Breadcrumb items={breadcrumbItems} className="text-sm" />
        {image ? (
          <div className="relative h-44 overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 sm:h-56">
            <Image src={image} alt={title} fill priority className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-slate-950/5 to-transparent" />
          </div>
        ) : null}
        <Stack gap="sm">
          <div className="flex flex-wrap items-center gap-3">
            <Heading as="h1" size="h1">
              {title}
            </Heading>
            {typeof productCount === 'number' ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {productCount} {productCount === 1 ? 'product' : 'products'}
              </span>
            ) : null}
          </div>
          <Text variant="muted" className="max-w-2xl">
            {description}
          </Text>
        </Stack>
      </header>

      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-6">
        <form action={basePath} className="space-y-5">
          {showCategoryFilters && filters.category ? <input type="hidden" name="category" value={filters.category} /> : null}
          <DiscoverySearch basePath={basePath} initialSearch={filters.search} suggestions={buildSuggestions(products, categories)} />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="block text-sm font-bold text-slate-700">
              Sort by
              <select
                name="sort"
                defaultValue={filters.sort}
                className="mt-2 w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name A-Z</option>
              </select>
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Min price
              <Input name="minPrice" type="number" min="0" defaultValue={filters.minPrice ?? ''} placeholder="0" className="mt-2 rounded-full py-3" />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Max price
              <Input name="maxPrice" type="number" min="0" defaultValue={filters.maxPrice ?? ''} placeholder="Any" className="mt-2 rounded-full py-3" />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Availability
              <select
                name="availability"
                defaultValue={filters.availability ?? ''}
                className="mt-2 w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              >
                <option value="">Any stock</option>
                <option value="in-stock">In stock</option>
                <option value="low-stock">Low stock</option>
                <option value="out-of-stock">Out of stock</option>
              </select>
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Brand
              <Input name="brand" defaultValue={filters.brand ?? ''} placeholder="Future ready" className="mt-2 rounded-full py-3" />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <PrimaryButton type="submit">Apply filters</PrimaryButton>
            <Link href={basePath}>
              <SecondaryButton type="button">Reset</SecondaryButton>
            </Link>
          </div>
        </form>

        {showCategoryFilters ? (
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href={buildHref(basePath, { search: filters.search, sort: filters.sort })}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${!filters.category ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              All
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={buildHref(basePath, { ...filters, category: category.slug, page: undefined })}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${filters.category === category.slug ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {category.name} ({category.productCount})
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      {products.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Try adjusting your search or category filter to explore more items."
          className="rounded-[2rem]"
        >
          <div className="mt-6 flex justify-center">
            <Link href={basePath}>
              <SecondaryButton type="button">Reset filters</SecondaryButton>
            </Link>
          </div>
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {products.map((product) => (
              <BaseCard key={product.id} className="group flex h-full flex-col overflow-hidden p-0">
                <div className="relative h-64 overflow-hidden bg-white">
                  <Image src={product.images[0]} alt={product.name} fill className="object-contain p-7 transition duration-500 group-hover:scale-110" />
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    {product.featured ? (
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white">
                        Featured
                      </span>
                    ) : null}
                    {product.newArrival ? (
                      <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white">
                        New
                      </span>
                    ) : null}
                  </div>
                  <WishlistButton productId={product.id} className="absolute right-14 top-4 h-8 w-8 bg-white/95" />
                  <span className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                    {formatStockStatus(product.stockStatus)}
                  </span>
                </div>
                <Stack gap="sm" className="flex-1 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Heading as="h3" size="h5" className="line-clamp-2 min-h-[44px]">{product.name}</Heading>
                      <Link href={`/products?category=${product.categorySlug}`} className="text-sm text-slate-500 transition hover:text-slate-900">
                        {product.categoryName}
                      </Link>
                    </div>
                    <span className="whitespace-nowrap text-lg font-black text-slate-950">{formatPrice(product.price)}</span>
                  </div>
                  <Text variant="muted" className="line-clamp-2">{product.shortDescription}</Text>
                  <div className="mt-auto flex flex-wrap gap-3">
                    <Link href={`/products/${product.slug}`}>
                      <PrimaryButton type="button">View details</PrimaryButton>
                    </Link>
                    <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I'm interested in ${product.name}`)}`} target="_blank" rel="noreferrer">
                      <SecondaryButton type="button">WhatsApp</SecondaryButton>
                    </a>
                  </div>
                </Stack>
              </BaseCard>
            ))}
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Text variant="muted">
              Showing {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
            </Text>
            <nav aria-label="Pagination" className="flex flex-wrap items-center gap-2">
              {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((page) => (
                <Link
                  key={page}
                  href={buildHref(basePath, { ...filters, page })}
                  aria-current={page === pagination.page ? 'page' : undefined}
                  className={`h-9 min-w-9 rounded-lg border px-3 py-2 text-center text-sm transition ${page === pagination.page ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                >
                  {page}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
