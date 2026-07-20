import * as React from 'react';

import { cn } from '@/lib/utils';

type SectionContainerProps = React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType;
  spacing?: 'sm' | 'md' | 'lg';
};

export function SectionContainer({
  as: Component = 'section',
  spacing = 'md',
  className,
  ...props
}: SectionContainerProps) {
  const spacingClass = {
    sm: 'py-8 sm:py-10',
    md: 'py-12 sm:py-16',
    lg: 'py-16 sm:py-24 lg:py-32',
  }[spacing];

  return <Component className={cn(spacingClass, className)} {...props} />;
}
