import { Badge, Heading, SecondaryButton, Text, WhatsAppButton } from '@/components/ui';
import type { Product } from '@/lib/products';

import { ProductGallery } from './product-gallery';

type ProductDetailsProps = {
  product: Product;
  whatsappNumber: string;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

function mapStockTone(status: Product['stockStatus']): 'success' | 'warning' | 'error' {
  if (status === 'in-stock') return 'success';
  if (status === 'low-stock') return 'warning';
  return 'error';
}

function formatStockLabel(status: Product['stockStatus']) {
  if (status === 'in-stock') return 'In stock';
  if (status === 'low-stock') return 'Low stock';
  return 'Out of stock';
}

export function ProductDetails({ product, whatsappNumber }: ProductDetailsProps) {
  const inquirySubject = encodeURIComponent(`Inquiry about ${product.name}`);

  return (
    <section className="grid gap-8 lg:grid-cols-2 lg:gap-12" aria-label="Product details">
      <ProductGallery images={product.images} productName={product.name} />

      <div className="space-y-6">
        <div className="space-y-2">
          <Text variant="caption" className="tracking-[0.14em]">{product.category}</Text>
          <Heading as="h1" size="h2">{product.name}</Heading>
          <p className="text-2xl font-semibold text-slate-900">{formatPrice(product.price)}</p>
        </div>

        <Badge tone={mapStockTone(product.stockStatus)}>{formatStockLabel(product.stockStatus)}</Badge>

        <Text variant="small" className="text-slate-700">{product.shortDescription}</Text>

        <Text variant="muted" className="text-slate-600">{product.description}</Text>

        <div className="flex flex-wrap gap-3">
          <WhatsAppButton href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I'm interested in ${product.name}`)}`}>
            WhatsApp
          </WhatsAppButton>
          <a href={`mailto:?subject=${inquirySubject}`}>
            <SecondaryButton>Inquiry</SecondaryButton>
          </a>
        </div>
      </div>
    </section>
  );
}
