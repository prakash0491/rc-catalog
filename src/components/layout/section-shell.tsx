import * as React from 'react';

import { cn } from '@/lib/utils';

type SectionShellProps = React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType;
  children: React.ReactNode;
};

export function SectionShell({ as: Component = 'section', children, className, ...props }: SectionShellProps) {
  return (
    <Component className={cn('w-full', className)} {...props}>
      {children}
    </Component>
  );
}
