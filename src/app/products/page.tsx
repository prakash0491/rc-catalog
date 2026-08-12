import { ResponsiveContainer, SectionContainer } from '@/components/common';
import { ProductCatalog } from '@/components/products/product-catalog';
import { getPublicContent } from '@/lib/public-content';
import { listPublicProducts, parseProductListQuery } from '@/lib/products';

const PRODUCTS_PER_PAGE = 9;

export const dynamic = 'force-dynamic';

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const filters = parseProductListQuery(params);

  const [data, publicContent] = await Promise.all([
    listPublicProducts({
      ...filters,
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
        />
      </ResponsiveContainer>
    </SectionContainer>
  );
}
