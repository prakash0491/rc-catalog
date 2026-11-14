'use client';

import { useState } from 'react';
import type { ProductVariantView } from '@/lib/products';
import { formatPrice } from '@/lib/money';
import { AddToCartButton } from './add-to-cart-button';

type ProductPurchaseOptionsProps = {
  productId: string;
  stockQuantity: number;
  variants: ProductVariantView[];
  /** Resolved on the server; browser bundles cannot read RAZORPAY_CURRENCY. */
  currency?: string;
};

export function ProductPurchaseOptions({ productId, stockQuantity, variants, currency }: ProductPurchaseOptionsProps) {
  const [selectedId, setSelectedId] = useState('');
  const selected = variants.find((variant) => variant.id === selectedId);
  const hasVariants = variants.length > 0;
  const available = hasVariants ? Boolean(selected && selected.stockQuantity > 0) : stockQuantity > 0;

  return (
    <div className="space-y-4">
      {hasVariants ? (
        <label className="block space-y-2 text-sm font-semibold text-slate-700">
          <span>Choose an option</span>
          <select className="block w-full rounded-xl border border-slate-300 bg-white p-3" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            <option value="">Select an option</option>
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id} disabled={variant.stockQuantity <= 0}>
                {variant.optionName}: {variant.optionValue}{variant.stockQuantity <= 0 ? ' — Out of stock' : ''}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {selected?.priceOverride !== null && selected?.priceOverride !== undefined ? (
        <p className="text-sm font-semibold text-slate-700">Selected option price: {formatPrice(selected.priceOverride, currency)}</p>
      ) : null}
      {available ? (
        <AddToCartButton key={selectedId || productId} productId={productId} variantId={selected?.id ?? null} />
      ) : (
        <p className="text-sm text-slate-500">{hasVariants ? 'Select an available option to add to cart.' : 'This item is currently out of stock.'}</p>
      )}
    </div>
  );
}
