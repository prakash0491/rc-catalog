import Link from 'next/link';

import { Heading, OutlineButton, ResponsiveImage, Text } from '@/components/ui';
import type { Product } from '@/lib/products';

import { ProductCard } from './product-card';
import { ProductList } from './product-list';

type RelatedProductsProps = {
  products: Product[];
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section aria-label="Related products" className="space-y-5">
      <Heading as="h2" size="h3">Related products</Heading>
      <ProductList className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            media={<ResponsiveImage src={product.images[0] ?? '/file.svg'} alt={product.name} className="aspect-[4/3] w-full object-cover" />}
            title={product.name}
            description={product.shortDescription}
            footer={
              <div className="flex items-center justify-between gap-3">
                <Text as="span" variant="small" className="font-semibold text-slate-900">
                  {formatPrice(product.price)}
                </Text>
                <Link href={`/products/${product.slug}`}>
                  <OutlineButton>View</OutlineButton>
                </Link>
              </div>
            }
          />
        ))}
      </ProductList>
    </section>
  );
}
