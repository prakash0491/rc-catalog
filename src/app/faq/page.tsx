import Link from 'next/link';

import { ResponsiveContainer, SectionContainer } from '@/components/common';
import { BaseCard, Breadcrumb, Heading, PrimaryButton, Text } from '@/components/ui';
import { getPublicContent } from '@/lib/public-content';

export const dynamic = 'force-dynamic';

export default async function FaqPage() {
  const { faqs, faqCategories } = await getPublicContent();

  return (
    <SectionContainer spacing="md">
      <ResponsiveContainer className="space-y-8">
        <header className="space-y-4">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'FAQ' }]} />
          <div className="space-y-3">
            <Heading as="h1" size="h1">Frequently asked questions</Heading>
            <Text variant="muted" className="max-w-2xl">
              Practical answers for browsing, inquiries, and product discovery.
            </Text>
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          {faqCategories.map((category) => (
            <a key={category.id} href={`#${category.slug}`} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
              {category.name}
            </a>
          ))}
        </div>

        <div className="space-y-8">
          {faqCategories.map((category) => {
            const categoryFaqs = faqs.filter((faq) => faq.category === category.slug);

            if (categoryFaqs.length === 0) {
              return null;
            }

            return (
              <section key={category.id} id={category.slug} className="space-y-4 scroll-mt-24">
                <Heading as="h2" size="h3">{category.name}</Heading>
                <div className="grid gap-4 lg:grid-cols-2">
                  {categoryFaqs.map((faq) => (
                    <BaseCard key={faq.id}>
                      <Heading as="h3" size="h4">{faq.question}</Heading>
                      <Text variant="muted" className="mt-3">{faq.answer}</Text>
                    </BaseCard>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <BaseCard className="flex flex-col gap-4 bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Heading as="h2" size="h4">Need more detail?</Heading>
            <Text variant="muted" className="mt-2">Send a product inquiry and the team will follow up.</Text>
          </div>
          <Link href="/contact">
            <PrimaryButton type="button">Contact us</PrimaryButton>
          </Link>
        </BaseCard>
      </ResponsiveContainer>
    </SectionContainer>
  );
}
