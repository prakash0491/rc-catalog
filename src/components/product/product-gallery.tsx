"use client";

import { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

import { cn } from '@/lib/utils';

type ProductGalleryProps = {
  images: string[];
  productName: string;
  className?: string;
};

export function ProductGallery({ images, productName, className }: ProductGalleryProps) {
  const safeImages = useMemo(() => (images.length > 0 ? images : ['/images/placeholder.svg']), [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOrigin, setZoomOrigin] = useState<{ x: number; y: number } | null>(null);

  const activeImage = safeImages[activeIndex] ?? safeImages[0];

  const goTo = useCallback(
    (index: number) => {
      const next = (index + safeImages.length) % safeImages.length;
      setActiveIndex(next);
      setZoomOrigin(null);
    },
    [safeImages.length]
  );

  return (
    <section aria-label="Product image gallery" className={cn('space-y-3', className)}>
      <div
        className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;
          setZoomOrigin({ x, y });
        }}
        onMouseLeave={() => setZoomOrigin(null)}
      >
        <Image
          src={activeImage}
          alt={productName}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className={cn(
            'object-cover transition-transform duration-200 ease-out',
            zoomOrigin ? 'scale-[1.9]' : 'scale-100'
          )}
          style={zoomOrigin ? { transformOrigin: `${zoomOrigin.x * 100}% ${zoomOrigin.y * 100}%` } : undefined}
        />

        {safeImages.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => goTo(activeIndex - 1)}
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white/95 text-slate-700 opacity-0 shadow-sm transition hover:bg-white group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => goTo(activeIndex + 1)}
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white/95 text-slate-700 opacity-0 shadow-sm transition hover:bg-white group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}

        <span className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm">
          <ZoomIn className="h-3.5 w-3.5" />
          Hover to zoom
        </span>
      </div>

      {safeImages.length > 1 ? (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5" role="list" aria-label="Product thumbnails">
          {safeImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              role="listitem"
              aria-label={`View image ${index + 1}`}
              aria-current={activeIndex === index}
              onClick={() => goTo(index)}
              className={cn(
                'relative aspect-square overflow-hidden rounded-xl border bg-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                activeIndex === index ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <Image
                src={image}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
