import { BaseCard, Container, Heading, Stack, Text } from '@/components/ui';

const reasons = [
  {
    title: 'Fast support',
    description: 'Responsive assistance whenever customers need guidance.',
    icon: '⚡',
  },
  {
    title: 'Premium products',
    description: 'A carefully curated catalog designed for quality and trust.',
    icon: '✨',
  },
  {
    title: 'Secure offline purchase',
    description: 'Flexible purchase flow that works smoothly for direct inquiry.',
    icon: '🔒',
  },
  {
    title: 'Trusted business',
    description: 'Professional presentation that builds customer confidence.',
    icon: '🏅',
  },
];

export function WhyUsSection() {
  return (
    <section>
      <Container className="py-8 sm:py-10">
        <div className="mb-8">
          <Heading as="h2" size="h2">Why choose us</Heading>
          <Text variant="muted">A polished experience built to make discovery feel refined and effortless.</Text>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {reasons.map((reason) => (
            <BaseCard key={reason.title} className="rounded-[1.5rem] bg-white">
              <Stack gap="sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                  {reason.icon}
                </div>
                <Heading as="h3" size="h4">{reason.title}</Heading>
                <Text variant="muted">{reason.description}</Text>
              </Stack>
            </BaseCard>
          ))}
        </div>
      </Container>
    </section>
  );
}
