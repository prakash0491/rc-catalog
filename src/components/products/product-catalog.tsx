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
    sort: ProductSortOption;
  };
  whatsappNumber: string;
  basePath?: string;
  title?: string;
  description?: string;
  breadcrumbItems?: Array<{ label: string; href?: string }>;
  showCategoryFilters?: boolean;
};

function formatStockStatus(status: PublicProductListItem['stockStatus']) {
  if (status === 'in-stock') return 'In stock';
  if (status === 'low-stock') return 'Low stock';
  return 'Out of stock';
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

function buildHref(basePath: string, params: ProductCatalogProps['filters'] & { page?: number }) {
  const query = new URLSearchParams();

  if (params.search) query.set('search', params.search);
  if (params.category) query.set('category', params.category);
  if (params.sort && params.sort !== 'featured') query.set('sort', params.sort);
  if (params.page && params.page > 1) query.set('page', params.page.toString());

  const queryString = query.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
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
  breadcrumbItems = [{ label: 'Home', href: '/' }, { label: 'Products' }],
  showCategoryFilters = true,
}: ProductCatalogProps) {
  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <Breadcrumb items={breadcrumbItems} className="text-sm" />
        <Stack gap="sm">
          <Heading as="h1" size="h1">
            {title}
          </Heading>
          <Text variant="muted" className="max-w-2xl">
            {description}
          </Text>
        </Stack>
      </header>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <form action={basePath} className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_auto]">
          {showCategoryFilters && filters.category ? <input type="hidden" name="category" value={filters.category} /> : null}
          <label className="block text-sm font-medium text-slate-700">
            Search products
            <Input name="search" defaultValue={filters.search ?? ''} placeholder="Search by product name" className="mt-2" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Sort by
            <select
              name="sort"
              defaultValue={filters.sort}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name A-Z</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <PrimaryButton type="submit">Apply</PrimaryButton>
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
                href={buildHref(basePath, { ...filters, category: category.slug })}
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
              <BaseCard key={product.id} className="flex h-full flex-col overflow-hidden p-0">
                <div className="relative h-56 overflow-hidden">
                  <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    {product.featured ? (
                      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                        Featured
                      </span>
                    ) : null}
                    {product.newArrival ? (
                      <span className="rounded-full bg-blue-600/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                        New
                      </span>
                    ) : null}
                  </div>
                </div>
                <Stack gap="sm" className="flex-1 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Heading as="h3" size="h4">{product.name}</Heading>
                      <Link href={`/products?category=${product.categorySlug}`} className="text-sm text-slate-500 transition hover:text-slate-900">
                        {product.categoryName}
                      </Link>
                    </div>
                    <span className="text-lg font-semibold text-slate-900">{formatPrice(product.price)}</span>
                  </div>
                  <div className="text-sm font-medium text-slate-600">{formatStockStatus(product.stockStatus)}</div>
                  <Text variant="muted">{product.shortDescription}</Text>
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
