import * as React from 'react';

import { cn } from '@/lib/utils';

type ResponsiveContainerProps = React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType;
};

export function ResponsiveContainer({ as: Component = 'div', className, ...props }: ResponsiveContainerProps) {
  return <Component className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)} {...props} />;
}
