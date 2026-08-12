'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';

import { IconButton } from '@/components/ui';
import { cn } from '@/lib/utils';

type WishlistButtonProps = {
  productId: string;
  initiallyWishlisted?: boolean;
  className?: string;
  variant?: 'icon' | 'full';
};

export function WishlistButton({ productId, initiallyWishlisted = false, className, variant = 'icon' }: WishlistButtonProps) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(initiallyWishlisted);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setWishlisted(initiallyWishlisted);
  }, [initiallyWishlisted]);

  const handleToggle = useCallback(async () => {
    setLoading(true);

    try {
      if (wishlisted) {
        const res = await fetch(`/api/wishlist/${productId}`, { method: 'DELETE' });
        if (res.ok) setWishlisted(false);
      } else {
        const res = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        });

        if (res.status === 201) {
          setWishlisted(true);
        } else if (res.status === 401) {
          router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
      router.refresh();
    }
  }, [productId, wishlisted, router]);

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition',
          wishlisted
            ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
          className
        )}
      >
        <Heart className={cn('h-4 w-4', wishlisted ? 'fill-rose-500 text-rose-500' : '')} />
        {wishlisted ? 'Saved' : 'Save to wishlist'}
      </button>
    );
  }

  return (
    <IconButton
      icon={
        <Heart
          className={cn('h-4 w-4', wishlisted ? 'fill-rose-500 text-rose-500' : '')}
        />
      }
      label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      onClick={handleToggle}
      disabled={loading}
      className={cn(wishlisted ? 'border-rose-200 hover:border-rose-300' : '', className)}
    />
  );
}