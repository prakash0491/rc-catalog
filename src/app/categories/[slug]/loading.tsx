import { ResponsiveContainer, SectionContainer } from '@/components/common';
import { ProductCatalogSkeleton } from '@/components/products/product-catalog-skeleton';

export default function CategoryProductsLoading() {
  return (
    <SectionContainer spacing="md">
      <ResponsiveContainer>
        <ProductCatalogSkeleton />
      </ResponsiveContainer>
    </SectionContainer>
  );
}
