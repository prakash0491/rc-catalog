import Image from 'next/image';
import Link from 'next/link';

import { ResponsiveContainer, SectionContainer } from '@/components/common';
import { BaseCard, Breadcrumb, Heading, PrimaryButton, Text } from '@/components/ui';
import { getPublicContent } from '@/lib/public-content';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const { businessProfile } = await getPublicContent();

  return (
    <SectionContainer spacing="md">
      <ResponsiveContainer className="space-y-10">
        <header className="space-y-4">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'About' }]} />
          <div className="space-y-3">
            <Heading as="h1" size="h1">About {businessProfile.name}</Heading>
            <Text variant="muted" className="max-w-3xl">{businessProfile.description}</Text>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="relative min-h-80 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            <Image src="/images/about-placeholder.jpg" alt={businessProfile.name} fill className="object-cover" />
          </div>
          <div className="space-y-6">
            <BaseCard>
              <Heading as="h2" size="h3">Our mission</Heading>
              <Text variant="muted" className="mt-3">{businessProfile.mission}</Text>
            </BaseCard>
            <BaseCard>
              <Heading as="h2" size="h3">Our vision</Heading>
              <Text variant="muted" className="mt-3">{businessProfile.vision}</Text>
            </BaseCard>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {(businessProfile.whyChooseUs ?? []).map((item) => (
            <BaseCard key={item.title}>
              <Heading as="h2" size="h4">{item.title}</Heading>
              <Text variant="muted" className="mt-3">{item.description}</Text>
            </BaseCard>
          ))}
        </section>

        <BaseCard className="flex flex-col gap-4 bg-slate-950 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Heading as="h2" size="h3" className="text-white">{businessProfile.aboutCta?.title ?? 'Explore the catalog'}</Heading>
            <Text variant="muted" className="mt-2 text-slate-300">{businessProfile.aboutCta?.description ?? businessProfile.tagline}</Text>
          </div>
          <Link href="/products">
            <PrimaryButton type="button">Browse products</PrimaryButton>
          </Link>
        </BaseCard>
      </ResponsiveContainer>
    </SectionContainer>
  );
}
