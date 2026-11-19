import { Badge, Heading, SecondaryButton, Text, WhatsAppButton } from '@/components/ui';
import type { Product } from '@/lib/products';
import { CHECKOUT_CURRENCY, computeDiscountPercent, formatPrice } from '@/lib/money';
import { ProductPurchaseOptions } from './product-purchase-options';
import { ProductGallery } from './product-gallery';
import { ShareButton } from './share-button';

type ProductDetailsProps = {
  product: Product;
  whatsappNumber: string;
  initiallyWishlisted?: boolean;
};

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

function resolvePricing(product: Product) {
  const discountPercent = computeDiscountPercent(product.price, product.mrp);

  if (discountPercent > 0 && product.mrp !== null) {
    return { mrp: product.mrp, discountPercent };
  }

  return { mrp: null, discountPercent: 0 };
}

function groupVariantsByOption(variants: Product['variants']) {
  return variants.reduce<Array<{ optionName: string; values: Product['variants'] }>>((groups, variant) => {
    const existing = groups.find((group) => group.optionName === variant.optionName);

    if (existing) {
      existing.values.push(variant);
    } else {
      groups.push({ optionName: variant.optionName, values: [variant] });
    }

    return groups;
  }, []);
}

export function ProductDetails({ product, whatsappNumber }: ProductDetailsProps) {
  const inquirySubject = encodeURIComponent(`Inquiry about ${product.name}`);

  const { mrp, discountPercent } = resolvePricing(product);
  const variantGroups = groupVariantsByOption(product.variants);

  return (
    <section className="grid gap-8 lg:grid-cols-2 lg:gap-12" aria-label="Product details">
      <ProductGallery images={product.images} productName={product.name} />

      <div className="space-y-6">
        <div className="space-y-2">
          <Text variant="caption" className="tracking-[0.14em]">{product.category}</Text>
          <Heading as="h1" size="h2">{product.name}</Heading>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="text-3xl font-black text-slate-950">{formatPrice(product.price)}</span>
            {mrp !== null ? (
              <span className="text-lg font-semibold text-slate-400 line-through">{formatPrice(mrp)}</span>
            ) : null}
            {discountPercent > 0 ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-700">
                {discountPercent}% off
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={mapStockTone(product.stockStatus)}>{formatStockLabel(product.stockStatus)}</Badge>
          {product.stockStatus === 'low-stock' && product.stockQuantity > 0 ? (
            <Text as="span" variant="small" className="font-semibold text-amber-700">
              Only {product.stockQuantity} left in stock
            </Text>
          ) : null}
        </div>

        {product.sku ? (
          <Text variant="caption" className="font-bold text-slate-400">SKU: {product.sku}</Text>
        ) : null}

        <Text variant="small" className="text-slate-700">{product.shortDescription}</Text>

        <Text variant="muted" className="text-slate-600">{product.description}</Text>

        <ProductPurchaseOptions productId={product.id} stockQuantity={product.stockQuantity} variants={product.variants} currency={CHECKOUT_CURRENCY} />

        <div className="flex flex-wrap gap-3">

        </div>

        {product.specifications.length > 0 ? (
          <section className="space-y-3" aria-label="Product specifications">
            <Heading as="h2" size="h4">Specifications</Heading>
            <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
              {product.specifications.map((spec, index) => (
                <div key={`${spec.name}-${index}`} className="grid grid-cols-[140px_1fr] gap-4 px-5 py-3 sm:grid-cols-[180px_1fr]">
                  <dt className="text-sm font-semibold text-slate-600">{spec.name}</dt>
                  <dd className="text-sm text-slate-900">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {variantGroups.length > 0 ? (
          <section className="space-y-4" aria-label="Available options">
            <Heading as="h2" size="h4">Available options</Heading>
            {variantGroups.map((group) => (
              <div key={group.optionName} className="space-y-2">
                <Text variant="caption" className="font-bold text-slate-500">{group.optionName}</Text>
                <div className="flex flex-wrap gap-2">
                  {group.values.map((variant) => (
                    <span
                      key={variant.id}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
                    >
                      {variant.optionValue}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <ShareButton productName={product.name} />
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
