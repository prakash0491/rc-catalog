import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

export function PageWrapper({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.main
      id="main-content"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn('flex-1', className)}
    >
      {children}
    </motion.main>
  );
}
