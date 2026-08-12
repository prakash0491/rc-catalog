'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Check } from 'lucide-react';

import { PrimaryButton } from '@/components/ui';
import { cn } from '@/lib/utils';

type AddToCartButtonProps = {
  productId: string;
  variantId?: string | null;
  className?: string;
};

export function AddToCartButton({ productId, variantId = null, className }: AddToCartButtonProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleAdd() {
    setLoading(true);

    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, variantId, quantity }),
      });

      if (res.ok) {
        setAdded(true);
        window.setTimeout(() => setAdded(false), 2000);
        router.refresh();
      } else if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          disabled={loading}
          className="grid h-9 w-9 place-items-center rounded-full text-slate-600 transition hover:bg-slate-50 disabled:opacity-30"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="min-w-[2rem] text-center text-sm font-bold text-slate-900">{quantity}</span>
        <button
          type="button"
          onClick={() => setQuantity(quantity + 1)}
          disabled={loading}
          className="grid h-9 w-9 place-items-center rounded-full text-slate-600 transition hover:bg-slate-50 disabled:opacity-30"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      <PrimaryButton type="button" onClick={handleAdd} loading={loading} className={cn('gap-2', added ? 'bg-emerald-600 hover:bg-emerald-700' : '')}>
        {added ? (
          <>
            <Check className="h-4 w-4" />
            Added!
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4" />
            Add to cart
          </>
        )}
      </PrimaryButton>
    </div>
  );
}