import * as React from 'react';

import { cn } from '@/lib/utils';

type ProductCardProps = React.HTMLAttributes<HTMLElement> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  media?: React.ReactNode;
  footer?: React.ReactNode;
};

export function ProductCard({ title, description, media, footer, className, ...props }: ProductCardProps) {
  return (
    <article className={cn('overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md', className)} {...props}>
      {media ? <div className="border-b border-slate-100">{media}</div> : null}
      <div className="space-y-3 p-5">
        {title ? <h3 className="text-lg font-semibold text-slate-900">{title}</h3> : null}
        {description ? <p className="text-sm leading-6 text-slate-600">{description}</p> : null}
        {footer ? <div className="pt-2">{footer}</div> : null}
      </div>
    </article>
  );
}
