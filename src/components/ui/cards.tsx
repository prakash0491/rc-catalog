import * as React from 'react';

import { cn } from '@/lib/utils';

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function BaseCard({ className, ...props }: CardProps) {
  return <div className={cn('rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition duration-300 hover:shadow-[0_24px_60px_rgba(15,23,42,0.1)]', className)} {...props} />;
}

export function ProductCardBase({ className, ...props }: CardProps) {
  return <div className={cn('overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.12)]', className)} {...props} />;
}

export function CategoryCardBase({ className, ...props }: CardProps) {
  return <div className={cn('rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_22px_55px_rgba(15,23,42,0.1)]', className)} {...props} />;
}

export function InfoCard({ className, ...props }: CardProps) {
  return <div className={cn('rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5 shadow-sm', className)} {...props} />;
}
