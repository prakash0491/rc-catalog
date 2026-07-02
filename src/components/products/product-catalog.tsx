"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import {
  BaseCard,
  Breadcrumb,
  EmptyState,
  Heading,
  Input,
  Pagination,
  PrimaryButton,
  SecondaryButton,
  Stack,
  Text,
} from '@/components/ui';
import { getProductsList, ProductUiShape } from '@/lib/products-api';

const PRODUCTS_PER_PAGE = 9;

type SortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'name-asc';

type ProductCatalogProps = {
  initialProducts: ProductUiShape[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function formatStockStatus(status: string) {
  switch (status) {
    case 'IN_STOCK':
      return 'In stock';
    case 'LOW_STOCK':
      return 'Low stock';
    case 'OUT_OF_STOCK':
      return 'Out of stock';
    default:
      return status;
  }
}

export function ProductCatalog({ initialProducts, pagination }: ProductCatalogProps) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map((product) => product.category)));
    return uniqueCategories.map((name, index) => ({ id: `${name}-${index}`, name, slug: name.toLowerCase() }));
  }, [products]);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setLoading(true);
      setError(null);

      try {
        const params: Record<string, string | undefined> = {
          search: search || undefined,
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          sort: sortBy,
          page: currentPage.toString(),
          limit: PRODUCTS_PER_PAGE.toString(),
        };

        const result = await getProductsList(params);
        if (isMounted) {
          setProducts(result.items);
        }
      } catch {
        if (isMounted) {
          setError('We could not load the catalog right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [search, selectedCategory, sortBy, currentPage]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const matchesCategory = selectedCategory === 'all' || product.categorySlug === selectedCategory;
      const matchesSearch = normalizedSearch.length === 0 || product.name.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return Number(b.newArrival) - Number(a.newArrival);
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'featured':
        default:
          return Number(b.featured) - Number(a.featured);
      }
    });

    return sorted;
  }, [products, search, selectedCategory, sortBy]);

  const totalPages = Math.max(1, Math.ceil(pagination.total / PRODUCTS_PER_PAGE));
  const pagedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSortBy('featured');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <Breadcrumb
          items={[{ label: 'Home', href: '/' }, { label: 'Products' }]}
          className="text-sm"
        />
        <Stack gap="sm">
          <Heading as="h1" size="h1">
            Product catalog
          </Heading>
          <Text variant="muted" className="max-w-2xl">
            Browse a thoughtfully curated collection with filtering, sorting, and a polished experience tailored for modern product discovery.
          </Text>
        </Stack>
      </header>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Search products
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by product name"
                className="mt-2"
              />
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Sort by
            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as SortOption);
                setCurrentPage(1);
              }}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name A–Z</option>
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setCurrentPage(1);
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${selectedCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setSelectedCategory(category.slug);
                setCurrentPage(1);
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${selectedCategory === category.slug ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      {filteredProducts.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Try adjusting your search or category filter to explore more items."
          className="rounded-[2rem]"
        >
          <div className="mt-6 flex justify-center">
            <SecondaryButton onClick={resetFilters}>Reset filters</SecondaryButton>
          </div>
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {pagedProducts.map((product) => (
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
                      <Text variant="muted">{product.category}</Text>
                    </div>
                    <span className="text-lg font-semibold text-slate-900">${product.price}</span>
                  </div>
                  <div className="text-sm font-medium text-slate-600">{formatStockStatus(product.stockStatus)}</div>
                  <Text variant="muted">{product.shortDescription}</Text>
                  <div className="mt-auto flex flex-wrap gap-3">
                    <Link href={`/products/${product.slug}`}>
                      <PrimaryButton>View details</PrimaryButton>
                    </Link>
                    <a href={`https://wa.me/15550100`} target="_blank" rel="noreferrer">
                      <SecondaryButton>WhatsApp</SecondaryButton>
                    </a>
                  </div>
                </Stack>
              </BaseCard>
            ))}
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Text variant="muted">
              Showing {(currentPage - 1) * PRODUCTS_PER_PAGE + 1}-{Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} products
            </Text>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </>
      )}
    </div>
  );
}
