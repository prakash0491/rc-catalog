import Link from 'next/link';

import { Container, Stack, Text } from '@/components/ui';
import { getPublicContent } from '@/lib/public-content';

export async function Footer() {
  const { businessProfile } = await getPublicContent();
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <Container className="grid gap-8 py-12 md:grid-cols-3">
        <Stack gap="sm">
          <p className="text-lg font-semibold text-slate-900">{businessProfile.name}</p>
          <Text variant="muted">{businessProfile.tagline}</Text>
          <Text variant="muted">{businessProfile.address}</Text>
        </Stack>

        <Stack gap="sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Quick links</p>
          {[
            { label: 'Products', href: '/products' },
            { label: 'About', href: '/about' },
            { label: 'FAQ', href: '/faq' },
            { label: 'Contact', href: '/contact' },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-slate-600 hover:text-slate-900">
              {item.label}
            </Link>
          ))}
        </Stack>

        <Stack gap="sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Contact</p>
          <a href={`mailto:${businessProfile.email}`} className="text-sm text-slate-600 hover:text-slate-900">
            {businessProfile.email}
          </a>
          <a href={`tel:${businessProfile.phone}`} className="text-sm text-slate-600 hover:text-slate-900">
            {businessProfile.phone}
          </a>
          <div className="flex gap-4">
            {businessProfile.socialLinks.map((item) => (
              <a key={item.href} href={item.href} target="_blank" rel="noreferrer" className="text-sm text-slate-600 hover:text-slate-900">
                {item.label}
              </a>
            ))}
          </div>
        </Stack>
      </Container>

      <div className="border-t border-slate-200 py-4">
        <Container className="flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} {businessProfile.name}. All rights reserved.</span>
          <span>{businessProfile.openingHours}</span>
        </Container>
      </div>
    </footer>
  );
}
