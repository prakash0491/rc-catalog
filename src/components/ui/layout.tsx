import { motion } from 'framer-motion';
import * as React from 'react';

import { cn } from '@/lib/utils';

type ContainerProps = React.HTMLAttributes<HTMLElement> & {
  as?: keyof React.JSX.IntrinsicElements;
};

export function Container({ as: Component = 'div', className, ...props }: ContainerProps) {
  return (
    <Component
      className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}
      {...props}
    />
  );
}

type SectionProps = React.HTMLAttributes<HTMLElement> & {
  as?: keyof React.JSX.IntrinsicElements;
  spacing?: 'sm' | 'md' | 'lg';
};

export function Section({ as: Component = 'section', spacing = 'md', className, ...props }: SectionProps) {
  const spacingClass = {
    sm: 'py-8 sm:py-10',
    md: 'py-12 sm:py-16',
    lg: 'py-16 sm:py-24 lg:py-32',
  }[spacing];

  return <Component className={cn(spacingClass, className)} {...props} />;
}

type StackProps = React.HTMLAttributes<HTMLDivElement> & {
  direction?: 'row' | 'col';
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  wrap?: boolean;
};

export function Stack({ direction = 'col', gap = 'md', wrap = false, className, ...props }: StackProps) {
  const gapClass = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  }[gap];

  return (
    <div
      className={cn('flex', direction === 'row' ? 'flex-row' : 'flex-col', gapClass, wrap && 'flex-wrap', className)}
      {...props}
    />
  );
}

type GridProps = React.HTMLAttributes<HTMLDivElement> & {
  cols?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
};

export function Grid({ cols = 2, gap = 'md', className, ...props }: GridProps) {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
  }[cols];

  const gapClass = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  }[gap];

  return <div className={cn('grid', colsClass, gapClass, className)} {...props} />;
}

type PageWrapperProps = React.HTMLAttributes<HTMLElement> & {
  children: React.ReactNode;
};

export function PageWrapper({ children, className, ...props }: PageWrapperProps) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn('min-h-screen bg-background text-foreground', className)}
      {...props}
    >
      {children}
    </motion.main>
  );
}
