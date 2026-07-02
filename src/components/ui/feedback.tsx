import * as React from 'react';

import { cn } from '@/lib/utils';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'default' | 'success' | 'warning' | 'error' | 'info';
};

export function Badge({ tone = 'default', className, ...props }: BadgeProps) {
  const toneClass = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-rose-100 text-rose-700',
    info: 'bg-sky-100 text-sky-700',
  }[tone];

  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-medium', toneClass, className)} {...props} />;
}

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: 'success' | 'warning' | 'error' | 'info';
};

export function Alert({ tone = 'info', className, ...props }: AlertProps) {
  const toneClass = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    error: 'border-rose-200 bg-rose-50 text-rose-700',
    info: 'border-sky-200 bg-sky-50 text-sky-700',
  }[tone];

  return <div className={cn('rounded-xl border p-4 text-sm', toneClass, className)} {...props} />;
}

type ToastProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
};

export function Toast({ title, children, className, ...props }: ToastProps) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-4 shadow-lg', className)} role="status" {...props}>
      {title ? <p className="font-medium text-slate-900">{title}</p> : null}
      {children ? <div className="mt-1 text-sm text-slate-600">{children}</div> : null}
    </div>
  );
}

export function Spinner({ className }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600', className)} />;
}

export function Skeleton({ className }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-200', className)} />;
}
