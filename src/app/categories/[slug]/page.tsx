import { notFound } from 'next/navigation';

import { ResponsiveContainer, SectionContainer } from '@/components/common';
import { ProductCatalog } from '@/components/products/product-catalog';
import { getPublicContent } from '@/lib/public-content';
import { getPublicCategoryBySlug, listPublicProducts, ProductSortOption } from '@/lib/products';

const PRODUCTS_PER_PAGE = 9;
const sortOptions = new Set<ProductSortOption>(['featured', 'newest', 'price-asc', 'price-desc', 'name-asc']);

export const dynamic = 'force-dynamic';

type CategoryProductsPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    search?: string;
    sort?: string;
    page?: string;
  }>;
};

function parsePage(value: string | undefined) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function parseSort(value: string | undefined): ProductSortOption {
  return value && sortOptions.has(value as ProductSortOption) ? (value as ProductSortOption) : 'featured';
}

export default async function CategoryProductsPage({ params, searchParams }: CategoryProductsPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const category = await getPublicCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const search = query.search?.trim() || undefined;
  const sort = parseSort(query.sort);
  const page = parsePage(query.page);

  const [data, publicContent] = await Promise.all([
    listPublicProducts({
      search,
      category: category.slug,
      sort,
      page,
      limit: PRODUCTS_PER_PAGE,
    }),
    getPublicContent(),
  ]);

  return (
    <SectionContainer spacing="md">
      <ResponsiveContainer>
        <ProductCatalog
          products={data.items}
          categories={data.categories}
          pagination={data.pagination}
          filters={{ search, category: category.slug, sort }}
          whatsappNumber={publicContent.businessProfile.whatsapp.replace(/\D/g, '')}
          basePath={`/categories/${category.slug}`}
          title={category.name}
          description={category.description ?? `Browse active products in ${category.name}.`}
          breadcrumbItems={[
            { label: 'Home', href: '/' },
            { label: 'Categories', href: '/categories' },
            { label: category.name },
          ]}
          showCategoryFilters={false}
        />
      </ResponsiveContainer>
    </SectionContainer>
  );
}
