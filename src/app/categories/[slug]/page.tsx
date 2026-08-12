import { notFound } from 'next/navigation';

import { ResponsiveContainer, SectionContainer } from '@/components/common';
import { ProductCatalog } from '@/components/products/product-catalog';
import { getPublicContent } from '@/lib/public-content';
import { getPublicCategoryBySlug, listPublicProducts, parseProductListQuery } from '@/lib/products';

const PRODUCTS_PER_PAGE = 9;

export const dynamic = 'force-dynamic';

type CategoryProductsPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CategoryProductsPage({ params, searchParams }: CategoryProductsPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const category = await getPublicCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const filters = parseProductListQuery(query);

  const [data, publicContent] = await Promise.all([
    listPublicProducts({
      ...filters,
      category: category.slug,
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
          filters={filters}
          whatsappNumber={publicContent.businessProfile.whatsapp.replace(/\D/g, '')}
          basePath={`/categories/${category.slug}`}
          title={category.name}
          description={category.description ?? `Browse active products in ${category.name}.`}
          image={category.image}
          productCount={category._count.products}
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
