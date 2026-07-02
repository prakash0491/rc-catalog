import * as React from 'react';

import { cn } from '@/lib/utils';

type NavbarProps = React.HTMLAttributes<HTMLElement>;

type FooterProps = React.HTMLAttributes<HTMLElement>;

type BreadcrumbProps = React.HTMLAttributes<HTMLElement> & {
  items: Array<{ label: string; href?: string }>;
};

type PaginationProps = React.HTMLAttributes<HTMLElement> & {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
};

export function Navbar({ className, ...props }: NavbarProps) {
  return <nav className={cn('border-b border-slate-200 bg-white/80 backdrop-blur', className)} {...props} />;
}

export function Footer({ className, ...props }: FooterProps) {
  return <footer className={cn('border-t border-slate-200 bg-slate-50', className)} {...props} />;
}

export function Breadcrumb({ items, className, ...props }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-2 text-sm text-slate-600', className)} {...props}>
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 ? <span>/</span> : null}
          {item.href ? (
            <a href={item.href} className="transition hover:text-slate-900">
              {item.label}
            </a>
          ) : (
            <span className="text-slate-900">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export function Pagination({ currentPage, totalPages, onPageChange, className, ...props }: PaginationProps) {
  return (
    <nav aria-label="Pagination" className={cn('flex items-center gap-2', className)} {...props}>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange?.(page)}
          aria-current={page === currentPage ? 'page' : undefined}
          className={cn('h-9 min-w-9 rounded-lg border px-3 text-sm transition', page === currentPage ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}
        >
          {page}
        </button>
      ))}
    </nav>
  );
}
