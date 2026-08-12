'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';

import { ResponsiveContainer, SectionContainer } from '@/components/common';
import { BaseCard, EmptyState, Heading, IconButton, PrimaryButton, Text } from '@/components/ui';

type WishlistItem = {
  id: string;
  productId: string;
  product: {
    id: string;
    slug: string;
    name: string;
    shortDescription: string;
    price: number;
    mrp: number | null;
    stockStatus: string;
    images: { url: string }[];
    category: { name: string; slug: string };
  };
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/wishlist')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setItems(data.data.items);
        else router.push('/login?next=/wishlist');
      })
      .catch(() => router.push('/login?next=/wishlist'))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleRemove(productId: string) {
    setRemoving(productId);
    try {
      await fetch(`/api/wishlist/${productId}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((item) => item.productId !== productId));
    } catch {
      // Silently fail; list stays unchanged
    } finally {
      setRemoving(null);
    }
  }

  async function handleAddToCart(productId: string) {
    try {
      await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
    } catch {
      // Silently fail
    }
  }

  if (loading) {
    return (
      <SectionContainer spacing="md">
        <ResponsiveContainer>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-[1.5rem] bg-slate-200" />
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
          <Heading as="h1" size="h1">My wishlist</Heading>
          <Text variant="muted">{items.length} {items.length === 1 ? 'item' : 'items'} saved</Text>
        </header>

        {items.length === 0 ? (
          <EmptyState
            title="Your wishlist is empty"
            description="Browse products and save your favorites for later."
            className="rounded-[2rem]"
          >
            <Link href="/products" className="mt-4 inline-block">
              <PrimaryButton type="button">Browse products</PrimaryButton>
            </Link>
          </EmptyState>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <BaseCard key={item.id} className="group flex flex-col overflow-hidden p-0">
                <Link href={`/products/${item.product.slug}`} className="relative h-56 bg-slate-50">
                  <Image
                    src={item.product.images[0]?.url ?? '/images/placeholder.svg'}
                    alt={item.product.name}
                    fill
                    className="object-contain p-6 transition duration-300 group-hover:scale-105"
                  />
                </Link>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div>
                    <Link href={`/products?category=${item.product.category.slug}`} className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {item.product.category.name}
                    </Link>
                    <Link href={`/products/${item.product.slug}`}>
                      <Heading as="h3" size="h5" className="mt-1 line-clamp-1">{item.product.name}</Heading>
                    </Link>
                    <span className="mt-1 block text-lg font-bold text-slate-900">{formatPrice(item.product.price)}</span>
                  </div>
                  <Text variant="muted" className="line-clamp-2 text-sm">{item.product.shortDescription}</Text>
                  <div className="mt-auto flex items-center gap-2 pt-2">
                    <PrimaryButton
                      type="button"
                      className="flex-1 text-sm"
                      onClick={() => handleAddToCart(item.productId)}
                    >
                      Add to cart
                    </PrimaryButton>
                    <IconButton
                      icon={<Heart className="h-4 w-4 text-rose-500" />}
                      label={`Remove ${item.product.name} from wishlist`}
                      onClick={() => handleRemove(item.productId)}
                      disabled={removing === item.productId}
                      className="border-rose-200 hover:border-rose-300"
                    />
                  </div>
                </div>
              </BaseCard>
            ))}
          </div>
        )}
      </ResponsiveContainer>
    </SectionContainer>
  );
}