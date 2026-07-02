import Image from 'next/image';
import Link from 'next/link';

import { BaseCard, Container, Heading, PrimaryButton, Stack, Text } from '@/components/ui';

export function AboutPreviewSection() {
  return (
    <section>
      <Container className="py-8 sm:py-10">
        <BaseCard className="overflow-hidden rounded-[2rem] border-slate-200 bg-slate-50 p-0">
          <div className="grid items-center gap-0 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative h-72 w-full lg:h-full">
              <Image src="/images/about-placeholder.jpg" alt="About preview" fill className="object-cover" />
            </div>
            <Stack gap="md" className="p-8 sm:p-10 lg:p-12">
              <Heading as="h2" size="h2">About our catalog</Heading>
              <Text variant="default">
                Our experience is designed to present products with clarity, confidence, and a premium feel while keeping the browsing journey simple and intuitive.
              </Text>
              <Text variant="muted">
                The platform is built to be flexible for future expansion while staying elegant for the current brand experience.
              </Text>
              <Link href="/about" className="w-fit">
                <PrimaryButton>Read more</PrimaryButton>
              </Link>
            </Stack>
          </div>
        </BaseCard>
      </Container>
    </section>
  );
}
