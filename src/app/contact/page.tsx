import Link from 'next/link';

import { ResponsiveContainer, SectionContainer } from '@/components/common';
import { ContactCard } from '@/components/inquiry';
import { BaseCard, Breadcrumb, Heading, Input, PrimaryButton, Text, Textarea, WhatsAppButton } from '@/components/ui';
import { getPublicContent } from '@/lib/public-content';

export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const { businessProfile } = await getPublicContent();
  const whatsappHref = `https://wa.me/${businessProfile.whatsapp.replace(/\D/g, '')}`;

  return (
    <SectionContainer spacing="md">
      <ResponsiveContainer className="space-y-8">
        <header className="space-y-4">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />
          <div className="space-y-3">
            <Heading as="h1" size="h1">Contact {businessProfile.name}</Heading>
            <Text variant="muted" className="max-w-2xl">
              Reach out for product guidance, availability, and catalog inquiries.
            </Text>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <BaseCard>
            <form action={`mailto:${businessProfile.email}`} method="post" encType="text/plain" className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Name</span>
                  <Input name="name" required />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Email</span>
                  <Input name="email" type="email" required />
                </label>
              </div>
              <label className="space-y-2 block">
                <span className="text-sm font-medium text-slate-700">Phone</span>
                <Input name="phone" type="tel" />
              </label>
              <label className="space-y-2 block">
                <span className="text-sm font-medium text-slate-700">Message</span>
                <Textarea name="message" className="min-h-[180px]" required />
              </label>
              <PrimaryButton type="submit">Send inquiry</PrimaryButton>
            </form>
          </BaseCard>

          <div className="space-y-5">
            <ContactCard
              title="Direct contact"
              description={`${businessProfile.address} ${businessProfile.openingHours}`}
              actions={
                <>
                  <WhatsAppButton href={whatsappHref}>WhatsApp</WhatsAppButton>
                  <Link href={`mailto:${businessProfile.email}`}>
                    <PrimaryButton type="button">Email</PrimaryButton>
                  </Link>
                </>
              }
            />
            <BaseCard>
              <Heading as="h2" size="h4">Contact details</Heading>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>{businessProfile.email}</p>
                <p>{businessProfile.phone}</p>
                <p>{businessProfile.openingHours}</p>
              </div>
            </BaseCard>
          </div>
        </div>
      </ResponsiveContainer>
    </SectionContainer>
  );
}
