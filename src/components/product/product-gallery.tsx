"use client";

import { useMemo, useState } from 'react';

import { ResponsiveImage } from '@/components/ui';
import { cn } from '@/lib/utils';

type ProductGalleryProps = {
  images: string[];
  productName: string;
  className?: string;
};

export function ProductGallery({ images, productName, className }: ProductGalleryProps) {
  const safeImages = useMemo(() => (images.length > 0 ? images : ['/file.svg']), [images]);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeImage = safeImages[activeIndex] ?? safeImages[0];

  return (
    <section aria-label="Product image gallery" className={cn('space-y-3', className)}>
      <ResponsiveImage
        src={activeImage}
        alt={productName}
        className="aspect-square w-full rounded-2xl border border-slate-200 bg-slate-50 object-cover"
      />

      {safeImages.length > 1 ? (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5" role="list" aria-label="Product thumbnails">
          {safeImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              role="listitem"
              aria-label={`View image ${index + 1}`}
              aria-current={activeIndex === index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'overflow-hidden rounded-xl border bg-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                activeIndex === index ? 'border-blue-500' : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <ResponsiveImage src={image} alt={`${productName} thumbnail ${index + 1}`} className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
