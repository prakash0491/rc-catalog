import * as React from 'react';
import Image, { type ImageProps } from 'next/image';

import { cn } from '@/lib/utils';

type ResponsiveImageProps = Omit<ImageProps, 'width' | 'height'> & {
  containerClassName?: string;
  width?: number;
  height?: number;
};

type CarouselWrapperProps = React.HTMLAttributes<HTMLDivElement>;

type GalleryWrapperProps = React.HTMLAttributes<HTMLDivElement>;

export function ResponsiveImage({ containerClassName, className, width = 800, height = 800, alt, ...props }: ResponsiveImageProps) {
  return (
    <div className={cn('overflow-hidden rounded-xl', containerClassName)}>
      <Image width={width} height={height} alt={alt} className={cn('h-full w-full object-cover', className)} {...props} />
    </div>
  );
}

export function CarouselWrapper({ className, ...props }: CarouselWrapperProps) {
  return <div className={cn('relative overflow-hidden rounded-2xl', className)} {...props} />;
}

export function GalleryWrapper({ className, ...props }: GalleryWrapperProps) {
  return <div className={cn('grid gap-4 md:grid-cols-2 xl:grid-cols-3', className)} {...props} />;
}
