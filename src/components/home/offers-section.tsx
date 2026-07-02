import Link from 'next/link';

import { BaseCard, Container, Heading, PrimaryButton, Stack, Text } from '@/components/ui';
import { getPublicContent } from '@/lib/public-content';

export async function OffersSection() {
  const { offers } = await getPublicContent();

  return (
    <section>
      <Container className="py-6 sm:py-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <Heading as="h2" size="h2">Current offers</Heading>
            <Text variant="muted">Featured promotions curated for the season.</Text>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {offers.map((offer) => (
            <BaseCard key={offer.id} className="rounded-[1.5rem] bg-slate-50 p-8">
              <Stack gap="sm">
                <span className="inline-flex w-fit rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                  Seasonal offer
                </span>
                <Heading as="h3" size="h3">{offer.title}</Heading>
                <Text variant="default">{offer.description}</Text>
                <Link href="/products">
                  <PrimaryButton>Explore now</PrimaryButton>
                </Link>
              </Stack>
            </BaseCard>
          ))}
        </div>
      </Container>
    </section>
  );
}
