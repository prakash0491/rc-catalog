'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2 } from 'lucide-react';

import { ResponsiveContainer, SectionContainer } from '@/components/common';
import { Alert, BaseCard, EmptyState, Heading, IconButton, PrimaryButton, Text } from '@/components/ui';
import { formatPrice } from '@/lib/money';

type CartItem = {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    mrp: number | null;
    stockQuantity: number;
    stockStatus: string;
    images: { url: string }[];
  };
  variant: {
    id: string;
    optionName: string;
    optionValue: string;
    priceOverride: number | null;
  } | null;
};

type Cart = {
  id: string;
  items: CartItem[];
} | null;

function computeItemPrice(product: CartItem['product'], variant: CartItem['variant']): number {
  if (variant?.priceOverride !== null && variant?.priceOverride !== undefined) {
    return Number(variant.priceOverride);
  }
  return Number(product.price);
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [currency, setCurrency] = useState('INR');
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch('/api/cart');
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setFeedback(data?.error?.message ?? 'Unable to load your cart.');
        return;
      }

      setCart(data.data.cart);
      if (typeof data.data.currency === 'string') {
        setCurrency(data.data.currency);
      }
    } catch {
      setFeedback('Unable to load your cart.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  async function handleUpdateQuantity(itemId: string, newQuantity: number) {
    if (newQuantity < 1) {
      await handleRemoveItem(itemId);
      return;
    }

    setUpdating(itemId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error?.message ?? 'Unable to update the quantity.');
      }

      await fetchCart();
      router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to update the quantity.');
    } finally {
      setUpdating(null);
    }
  }

  async function handleRemoveItem(itemId: string) {
    setUpdating(itemId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error?.message ?? 'Unable to remove this item.');
      }

      await fetchCart();
      router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to remove this item.');
    } finally {
      setUpdating(null);
    }
  }

  const items = cart?.items ?? [];
  const subtotal = items.reduce((sum, item) => sum + computeItemPrice(item.product, item.variant) * item.quantity, 0);

  if (loading) {
    return (
      <SectionContainer spacing="md">
        <ResponsiveContainer>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-[1.5rem] bg-slate-200" />
            ))}
          </div>
        </ResponsiveContainer>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer spacing="md">
      <ResponsiveContainer className="space-y-8">
        <header className="space-y-2">
          <Heading as="h1" size="h1">Shopping cart</Heading>
          <Text variant="muted">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </Text>
        </header>

        {feedback ? <Alert tone="error">{feedback}</Alert> : null}

        {items.length === 0 ? (
          <EmptyState
            title="Your cart is empty"
            description="Add some products to get started."
            className="rounded-[2rem]"
          >
            <Link href="/products" className="mt-4 inline-block">
              <PrimaryButton type="button">Continue shopping</PrimaryButton>
            </Link>
          </EmptyState>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {items.map((item) => {
                const itemPrice = computeItemPrice(item.product, item.variant);
                const lineTotal = itemPrice * item.quantity;

                return (
                  <BaseCard key={item.id} className="flex gap-4 p-4 sm:gap-6 sm:p-5">
                    <Link href={`/products/${item.product.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-50 sm:h-28 sm:w-28">
                      <Image
                        src={item.product.images[0]?.url ?? '/images/placeholder.svg'}
                        alt={item.product.name}
                        fill
                        className="object-contain p-3"
                      />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                      <div>
                        <Link href={`/products/${item.product.slug}`} className="font-semibold text-slate-900 hover:text-blue-700">
                          {item.product.name}
                        </Link>
                        {item.variant ? (
                          <Text variant="caption" className="text-slate-500">
                            {item.variant.optionName}: {item.variant.optionValue}
                          </Text>
                        ) : null}
                        <Text variant="small" className="mt-0.5 font-bold text-slate-900">
                          {formatPrice(itemPrice, currency)}
                        </Text>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={updating !== null}
                            className="grid h-8 w-8 place-items-center rounded-full text-slate-600 transition hover:bg-slate-50 disabled:opacity-30"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-[2rem] text-center text-sm font-bold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={updating !== null}
                            className="grid h-8 w-8 place-items-center rounded-full text-slate-600 transition hover:bg-slate-50 disabled:opacity-30"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <Text variant="small" className="font-bold text-slate-900">
                            {formatPrice(lineTotal, currency)}
                          </Text>
                          <IconButton
                            icon={<Trash2 className="h-4 w-4 text-rose-500" />}
                            label={`Remove ${item.product.name} from cart`}
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={updating !== null}
                            className="h-8 w-8 border-rose-200 hover:border-rose-300"
                          />
                        </div>
                      </div>
                    </div>
                  </BaseCard>
                );
              })}
            </div>

            <div className="lg:sticky lg:top-28 lg:self-start">
              <BaseCard className="space-y-4">
                <Heading as="h2" size="h4">Order summary</Heading>
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900">{formatPrice(subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Shipping</span>
                    <span>Calculated at next step</span>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="text-xl font-bold text-slate-900">{formatPrice(subtotal, currency)}</span>
                  </div>
                </div>
                <Link href="/checkout" className="block w-full">
                  <PrimaryButton type="button" className="w-full">
                    Proceed to checkout
                  </PrimaryButton>
                </Link>
                <Text variant="caption" className="text-center text-slate-400">
                  Payment is confirmed securely with Razorpay at checkout.
                </Text>
              </BaseCard>
            </div>
          </div>
        )}
      </ResponsiveContainer>
    </SectionContainer>
  );
}
