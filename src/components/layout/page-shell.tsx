import * as React from 'react';

import { cn } from '@/lib/utils';

type PageShellProps = React.HTMLAttributes<HTMLElement> & {
  children: React.ReactNode;
};

export function PageShell({ children, className, ...props }: PageShellProps) {
  return (
    <main className={cn('min-h-screen bg-background text-foreground', className)} {...props}>
      {children}
    </main>
  );
}
