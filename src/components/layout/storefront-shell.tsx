'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

type StorefrontShellProps = {
  navbar: ReactNode;
  footer: ReactNode;
  children: ReactNode;
};

export function StorefrontShell({ navbar, footer, children }: StorefrontShellProps) {
  const pathname = usePathname();
  const isAdminArea = pathname.startsWith('/admin');

  if (isAdminArea) {
    return <>{children}</>;
  }

  return (
    <>
      {navbar}
      <main id="main-content">{children}</main>
      {footer}
    </>
  );
}
