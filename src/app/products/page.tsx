import { ResponsiveContainer, SectionContainer } from '@/components/common';
import { ProductCatalog } from '@/components/products/product-catalog';
import { getPublicContent } from '@/lib/public-content';
import { listPublicProducts, ProductSortOption } from '@/lib/products';

const PRODUCTS_PER_PAGE = 9;
const sortOptions = new Set<ProductSortOption>(['featured', 'newest', 'price-asc', 'price-desc', 'name-asc']);

export const dynamic = 'force-dynamic';

type ProductsPageProps = {
  searchParams: Promise<{
    search?: string;
    category?: string;
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

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const search = params.search?.trim() || undefined;
  const category = params.category?.trim() || undefined;
  const sort = parseSort(params.sort);
  const page = parsePage(params.page);

  const [data, publicContent] = await Promise.all([
    listPublicProducts({
      search,
      category,
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
          filters={{ search, category, sort }}
          whatsappNumber={publicContent.businessProfile.whatsapp.replace(/\D/g, '')}
        />
      </ResponsiveContainer>
    </SectionContainer>
  );
}
