import * as React from 'react';

import { cn } from '@/lib/utils';

type ResponsiveImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  containerClassName?: string;
};

type CarouselWrapperProps = React.HTMLAttributes<HTMLDivElement>;

type GalleryWrapperProps = React.HTMLAttributes<HTMLDivElement>;

export function ResponsiveImage({ containerClassName, className, ...props }: ResponsiveImageProps) {
  return (
    <div className={cn('overflow-hidden rounded-xl', containerClassName)}>
      <img className={cn('h-full w-full object-cover', className)} {...props} />
    </div>
  );
}

export function CarouselWrapper({ className, ...props }: CarouselWrapperProps) {
  return <div className={cn('relative overflow-hidden rounded-2xl', className)} {...props} />;
}

export function GalleryWrapper({ className, ...props }: GalleryWrapperProps) {
  return <div className={cn('grid gap-4 md:grid-cols-2 xl:grid-cols-3', className)} {...props} />;
}
