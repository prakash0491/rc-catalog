import * as React from 'react';

import { cn } from '@/lib/utils';

type InputBaseProps = React.InputHTMLAttributes<HTMLInputElement>;

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement>;

type RadioProps = React.InputHTMLAttributes<HTMLInputElement>;

type SwitchProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputBaseProps) {
  return (
    <input
      className={cn('w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20', className)}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn('min-h-[120px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20', className)}
      {...props}
    />
  );
}

export function SearchInput({ className, ...props }: InputBaseProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
      <input
        className={cn('w-full rounded-full border border-slate-300 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20', className)}
        type="search"
        {...props}
      />
    </div>
  );
}

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn('w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20', className)}
      {...props}
    >
      {children}
    </select>
  );
}

export function Checkbox({ className, ...props }: CheckboxProps) {
  return <input type="checkbox" className={cn('h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500', className)} {...props} />;
}

export function Radio({ className, ...props }: RadioProps) {
  return <input type="radio" className={cn('h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500', className)} {...props} />;
}

export function Switch({ className, ...props }: SwitchProps) {
  return (
    <label className="inline-flex cursor-pointer items-center">
      <input type="checkbox" className="peer sr-only" {...props} />
      <span className={cn('relative inline-flex h-6 w-11 items-center rounded-full bg-slate-300 transition peer-checked:bg-blue-600', className)}>
        <span className="absolute left-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
