import * as React from 'react';

import { cn } from '@/lib/utils';

type DividerProps = React.HTMLAttributes<HTMLHRElement>;

type EmptyStateProps = React.HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
};

type ErrorStateProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
  description?: string;
};

type LoadingStateProps = React.HTMLAttributes<HTMLDivElement> & {
  label?: string;
};

export function Divider({ className, ...props }: DividerProps) {
  return <hr className={cn('my-6 border-slate-200', className)} {...props} />;
}

export function EmptyState({ title, description, className, ...props }: EmptyStateProps) {
  return (
    <div className={cn('rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center', className)} {...props}>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description = 'Please try again later.', className, ...props }: ErrorStateProps) {
  return (
    <div className={cn('rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700', className)} {...props}>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm">{description}</p>
    </div>
  );
}

export function LoadingState({ label = 'Loading...', className, ...props }: LoadingStateProps) {
  return (
    <div className={cn('flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-8', className)} {...props}>
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      <p className="text-sm text-slate-600">{label}</p>
    </div>
  );
}
