import * as React from 'react';

import { cn } from '@/lib/utils';

type HeroSectionShellProps = React.HTMLAttributes<HTMLElement> & {
  children: React.ReactNode;
};

export function HeroSectionShell({ children, className, ...props }: HeroSectionShellProps) {
  return (
    <section className={cn('overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 shadow-sm sm:p-10', className)} {...props}>
      {children}
    </section>
  );
}
