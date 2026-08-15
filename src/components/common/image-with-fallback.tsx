"use client";

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

const DEFAULT_FALLBACK = '/images/placeholder.svg';

type ImageWithFallbackProps = Omit<ImageProps, 'src' | 'onError'> & {
  src: string | null | undefined;
  fallback?: string;
};

export function ImageWithFallback({ src, alt, fallback = DEFAULT_FALLBACK, ...rest }: ImageWithFallbackProps) {
  const initialSrc = src && src.trim().length > 0 ? src : fallback;
  const [currentSrc, setCurrentSrc] = useState(initialSrc);

  return (
    <Image
      {...rest}
      src={currentSrc}
      alt={alt}
      onError={() => {
        if (currentSrc !== fallback) {
          setCurrentSrc(fallback);
        }
      }}
    />
  );
}
