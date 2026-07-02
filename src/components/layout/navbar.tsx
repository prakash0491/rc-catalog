import Link from 'next/link';

import { Container, SearchInput, Stack } from '@/components/ui';
import { getPublicContent } from '@/lib/public-content';

export async function Navbar() {
  const { businessProfile } = await getPublicContent();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <Container className="flex items-center justify-between gap-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900 no-underline">
          {businessProfile.name}
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {[
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/products' },
            { label: 'About', href: '/about' },
            { label: 'FAQ', href: '/faq' },
            { label: 'Contact', href: '/contact' },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
              {item.label}
            </Link>
          ))}
        </nav>

        <Stack direction="row" gap="sm" className="items-center">
          <div className="hidden w-64 lg:block">
            <SearchInput aria-label="Search products" placeholder="Search" />
          </div>
          <Link href="/contact" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            Contact
          </Link>
        </Stack>
      </Container>
    </header>
  );
}
