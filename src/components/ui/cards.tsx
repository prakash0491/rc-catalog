import * as React from 'react';

import { cn } from '@/lib/utils';

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function BaseCard({ className, ...props }: CardProps) {
  return <div className={cn('rounded-2xl border border-slate-200 bg-white p-6 shadow-sm', className)} {...props} />;
}

export function ProductCardBase({ className, ...props }: CardProps) {
  return <div className={cn('overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md', className)} {...props} />;
}

export function CategoryCardBase({ className, ...props }: CardProps) {
  return <div className={cn('rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:border-slate-300 hover:bg-white', className)} {...props} />;
}

export function InfoCard({ className, ...props }: CardProps) {
  return <div className={cn('rounded-2xl border border-slate-200 bg-slate-50 p-5', className)} {...props} />;
}
