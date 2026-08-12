import Image from 'next/image';
import Link from 'next/link';

import { BaseCard, Container, Heading, PrimaryButton, Stack, Text } from '@/components/ui';
import { getPublicContent } from '@/lib/public-content';

export async function OffersSection() {
  const { offers } = await getPublicContent();

  if (offers.length === 0) {
    return null;
  }

  return (
    <section className="bg-white">
      <Container className="pb-6 pt-2 sm:pb-8">
        <div className="premium-scrollbar flex gap-5 overflow-x-auto pb-3">
          {offers.map((offer) => (
            <BaseCard key={offer.id} className="relative min-w-[300px] flex-1 overflow-hidden border-slate-200 bg-slate-950 p-0 text-white sm:min-w-[420px]">
              {offer.image ? (
                <Image src={offer.image} alt={offer.title} fill className="object-cover opacity-45" />
              ) : null}
              <div className="relative p-7 sm:p-8">
                <Stack gap="sm">
                  <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-slate-950">
                    Limited offer
                  </span>
                  <Heading as="h3" size="h3" className="max-w-lg text-white">
                    {offer.title}
                  </Heading>
                  <Text variant="default" className="max-w-xl text-white/75">
                    {offer.description}
                  </Text>
                  <Link href="/products" className="pt-2">
                    <PrimaryButton className="bg-white text-slate-950 hover:bg-slate-100">Explore now</PrimaryButton>
                  </Link>
                </Stack>
              </div>
            </BaseCard>
          ))}
        </div>
      </Container>
    </section>
  );
}
