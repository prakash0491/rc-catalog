import * as React from 'react';

import { cn } from '@/lib/utils';

type ButtonBaseProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  fullWidth?: boolean;
};

const baseButtonClasses = 'inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

export function PrimaryButton({ className, loading = false, disabled, children, ...props }: ButtonBaseProps) {
  return (
    <button
      className={cn(baseButtonClasses, 'border-transparent bg-blue-600 text-white hover:bg-blue-700', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}

export function SecondaryButton({ className, loading = false, disabled, children, ...props }: ButtonBaseProps) {
  return (
    <button
      className={cn(baseButtonClasses, 'border-slate-200 bg-slate-100 text-slate-900 hover:bg-slate-200', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}

export function OutlineButton({ className, loading = false, disabled, children, ...props }: ButtonBaseProps) {
  return (
    <button
      className={cn(baseButtonClasses, 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}

export function GhostButton({ className, loading = false, disabled, children, ...props }: ButtonBaseProps) {
  return (
    <button
      className={cn(baseButtonClasses, 'border-transparent bg-transparent text-slate-700 hover:bg-slate-100', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: React.ReactNode;
  label: string;
};

export function IconButton({ icon, label, className, ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn('inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500', className)}
      {...props}
    >
      {icon}
    </button>
  );
}

type WhatsAppButtonProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

export function WhatsAppButton({ href, className, children = 'Contact via WhatsApp', ...props }: WhatsAppButtonProps) {
  return (
    <a
      href={href}
      className={cn('inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2', className)}
      target="_blank"
      rel="noreferrer"
      {...props}
    >
      {children}
    </a>
  );
}

export function LoadingButton({ className, loading = false, disabled, children, ...props }: ButtonBaseProps) {
  return (
    <PrimaryButton className={cn('gap-2', className)} loading={loading} disabled={disabled || loading} {...props}>
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
      {children}
    </PrimaryButton>
  );
}
