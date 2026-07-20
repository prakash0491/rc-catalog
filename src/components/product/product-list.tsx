import * as React from 'react';

import { cn } from '@/lib/utils';

type ProductListProps = React.HTMLAttributes<HTMLElement> & {
  children: React.ReactNode;
};

export function ProductList({ children, className, ...props }: ProductListProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3', className)} {...props}>
      {children}
    </div>
  );
}
