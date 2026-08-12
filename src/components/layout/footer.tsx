import Link from 'next/link';

import { Container, Stack, Text } from '@/components/ui';
import { getPublicContent } from '@/lib/public-content';

export async function Footer() {
  const { businessProfile, categories } = await getPublicContent();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#050608] text-white">
      <Container className="grid gap-10 py-16 md:grid-cols-[1.25fr_0.8fr_0.9fr_0.9fr] lg:py-20">
        <Stack gap="lg">
          <Link href="/" className="flex items-center gap-3 text-white" aria-label={`${businessProfile.name} home`}>
            <span className="grid h-14 w-14 place-items-center rounded-full border-2 border-white text-2xl font-black">Q</span>
            <span className="leading-none">
              <span className="block text-lg font-black uppercase tracking-tight">{businessProfile.name}</span>
              <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50">Store</span>
            </span>
          </Link>
          <Text variant="default" className="max-w-sm text-white/70">
            {businessProfile.description}
          </Text>
          <div className="space-y-3 text-sm font-bold">
            <a href={`tel:${businessProfile.phone}`} className="block text-white transition hover:text-white/70">
              {businessProfile.phone}
            </a>
            <a href={`mailto:${businessProfile.email}`} className="block text-white transition hover:text-white/70">
              {businessProfile.email}
            </a>
          </div>
        </Stack>

        <Stack gap="sm">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white">Platform</p>
          {[
            { label: 'All Collections', href: '/products' },
            { label: 'Shop by Category', href: '/categories' },
            { label: 'Featured Products', href: '/products?sort=featured' },
            { label: 'New Arrivals', href: '/products?sort=newest' },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-semibold text-white/60 transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </Stack>

        <Stack gap="sm">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white">Categories</p>
          {categories.slice(0, 5).map((category) => (
            <Link key={category.id} href={`/categories/${category.slug}`} className="text-sm font-semibold text-white/60 transition hover:text-white">
              {category.name}
            </Link>
          ))}
        </Stack>

        <Stack gap="sm">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white">Customer Care</p>
          {[
            { label: 'About Us', href: '/about' },
            { label: 'Contact Us', href: '/contact' },
            { label: 'FAQ', href: '/faq' },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-semibold text-white/60 transition hover:text-white">
              {item.label}
            </Link>
          ))}
          <div className="pt-4">
            {businessProfile.socialLinks.map((item) => (
              <a key={item.url} href={item.url} target="_blank" rel="noreferrer" className="mb-3 flex rounded-2xl bg-white/[0.07] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.12]">
                {item.platform}
              </a>
            ))}
          </div>
        </Stack>
      </Container>

      <div className="border-t border-white/10 py-5">
        <Container className="flex flex-col gap-3 text-xs font-bold uppercase tracking-[0.18em] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>{year} {businessProfile.name}. Redefining the hobby.</span>
          <span>{businessProfile.openingHours}</span>
        </Container>
      </div>
    </footer>
  );
}
