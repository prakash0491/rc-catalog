import * as React from 'react';

import { cn } from '@/lib/utils';

type ContactCardProps = React.HTMLAttributes<HTMLElement> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
};

export function ContactCard({ title, description, actions, className, ...props }: ContactCardProps) {
  return (
    <aside className={cn('rounded-2xl border border-slate-200 bg-slate-50 p-6', className)} {...props}>
      {title ? <h3 className="text-lg font-semibold text-slate-900">{title}</h3> : null}
      {description ? <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p> : null}
      {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
    </aside>
  );
}
