import Link from 'next/link';

import { BaseCard, Container, Heading, PrimaryButton, SecondaryButton, Stack, Text } from '@/components/ui';
import { getPublicContent } from '@/lib/public-content';

export async function ContactCtaSection() {
  const { businessProfile } = await getPublicContent();

  return (
    <section>
      <Container className="py-8 sm:py-10">
        <BaseCard className="rounded-[2rem] border-slate-200 bg-slate-950 p-8 text-white sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <Stack gap="md">
              <Heading as="h2" size="h2" className="text-white">
                Ready to discover more?
              </Heading>
              <Text variant="default" className="text-slate-300">
                Start a conversation through WhatsApp or contact us directly for a tailored product experience.
              </Text>
            </Stack>
            <Stack gap="md">
              <Link href={`https://wa.me/${businessProfile.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                <PrimaryButton className="w-full justify-center bg-emerald-500 text-white hover:bg-emerald-600">
                  Contact via WhatsApp
                </PrimaryButton>
              </Link>
              <Link href="/contact">
                <SecondaryButton className="w-full justify-center border-white/20 bg-white/10 text-white hover:bg-white/20">
                  Submit inquiry
                </SecondaryButton>
              </Link>
            </Stack>
          </div>
        </BaseCard>
      </Container>
    </section>
  );
}
