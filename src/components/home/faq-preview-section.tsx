import Link from 'next/link';

import { BaseCard, Container, Heading, PrimaryButton, Stack, Text } from '@/components/ui';
import { getPublicContent } from '@/lib/public-content';

export async function FaqPreviewSection() {
  const { faqs } = await getPublicContent();

  return (
    <section>
      <Container className="py-8 sm:py-10">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Heading as="h2" size="h2">Frequently asked questions</Heading>
            <Text variant="muted">A few common questions answered clearly and simply.</Text>
          </div>
          <Link href="/faq">
            <PrimaryButton>View all</PrimaryButton>
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {faqs.slice(0, 6).map((faq) => (
            <BaseCard key={faq.id} className="rounded-[1.5rem] bg-white">
              <Stack gap="sm">
                <Heading as="h3" size="h4">{faq.question}</Heading>
                <Text variant="muted">{faq.answer}</Text>
              </Stack>
            </BaseCard>
          ))}
        </div>
      </Container>
    </section>
  );
}
