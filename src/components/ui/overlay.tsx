import * as React from 'react';

import { cn } from '@/lib/utils';

type ModalProps = React.HTMLAttributes<HTMLDivElement> & {
  open?: boolean;
  title?: string;
};

type DrawerProps = React.HTMLAttributes<HTMLDivElement> & {
  open?: boolean;
  side?: 'left' | 'right';
};

type DropdownProps = React.HTMLAttributes<HTMLDivElement>;

type TooltipProps = React.HTMLAttributes<HTMLDivElement> & {
  content: string;
};

export function Modal({ open = false, title, className, children, ...props }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true">
      <div className={cn('w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl', className)} {...props}>
        {title ? <h3 className="text-lg font-semibold text-slate-900">{title}</h3> : null}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function Drawer({ open = false, side = 'right', className, children, ...props }: DrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50" role="dialog" aria-modal="true">
      <div className={cn('fixed top-0 h-full w-80 border-l border-slate-200 bg-white p-6 shadow-xl', side === 'left' ? 'left-0' : 'right-0', className)} {...props}>
        {children}
      </div>
    </div>
  );
}

export function Dropdown({ className, ...props }: DropdownProps) {
  return <div className={cn('relative', className)} {...props} />;
}

export function Tooltip({ content, className, children, ...props }: TooltipProps) {
  return (
    <div className="group relative inline-block" {...props}>
      {children}
      <span className={cn('pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 rounded-lg bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100', className)}>
        {content}
      </span>
    </div>
  );
}
