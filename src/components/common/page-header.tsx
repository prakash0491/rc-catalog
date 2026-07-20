import * as React from 'react';

import { cn } from '@/lib/utils';

type PageHeaderProps = React.HTMLAttributes<HTMLElement> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
};

export function PageHeader({ title, description, eyebrow, actions, className, ...props }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4', className)} {...props}>
      {eyebrow ? <div className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">{eyebrow}</div> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
          {description ? <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
