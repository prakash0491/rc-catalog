import * as React from 'react';

import { cn } from '@/lib/utils';

type ContentSectionProps = React.HTMLAttributes<HTMLElement> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
};

export function ContentSection({ title, description, children, className, ...props }: ContentSectionProps) {
  return (
    <section className={cn('space-y-6', className)} {...props}>
      {(title || description) ? (
        <div className="space-y-2">
          {title ? <h3 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h3> : null}
          {description ? <p className="text-sm leading-6 text-slate-600">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
