import * as React from 'react';

import { cn } from '@/lib/utils';

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: 'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
};

export function Heading({ as: Component = 'h2', size = 'h2', className, ...props }: HeadingProps) {
  const sizeClass = {
    display: 'text-4xl font-semibold tracking-tight sm:text-5xl',
    h1: 'text-3xl font-semibold tracking-tight sm:text-4xl',
    h2: 'text-2xl font-semibold tracking-tight sm:text-3xl',
    h3: 'text-xl font-semibold tracking-tight sm:text-2xl',
    h4: 'text-lg font-semibold tracking-tight sm:text-xl',
    h5: 'text-base font-semibold tracking-tight',
    h6: 'text-sm font-semibold tracking-tight',
  }[size];

  return <Component className={cn(sizeClass, className)} {...props} />;
}

type TextProps = React.HTMLAttributes<HTMLElement> & {
  as?: 'p' | 'span' | 'div';
  variant?: 'default' | 'muted' | 'small' | 'caption';
};

export function Text({ as: Component = 'p', variant = 'default', className, ...props }: TextProps) {
  const variantClass = {
    default: 'text-base leading-7 text-slate-700',
    muted: 'text-sm leading-6 text-slate-500',
    small: 'text-sm leading-6 text-slate-700',
    caption: 'text-xs uppercase tracking-[0.2em] text-slate-500',
  }[variant];

  return <Component className={cn(variantClass, className)} {...props} />;
}

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return <label className={cn('text-sm font-medium text-slate-700', className)} {...props} />;
}

type CaptionProps = React.HTMLAttributes<HTMLElement>;

export function Caption({ className, ...props }: CaptionProps) {
  return <p className={cn('text-xs leading-5 text-slate-500', className)} {...props} />;
}

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  external?: boolean;
};

export function Link({ external = false, className, ...props }: LinkProps) {
  return (
    <a
      className={cn('text-sm font-medium text-blue-600 transition hover:text-blue-700', className)}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      {...props}
    />
  );
}
