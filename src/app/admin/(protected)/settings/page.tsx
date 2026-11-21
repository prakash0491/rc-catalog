import { Container, Heading, Text } from '@/components/ui';
import { getBusinessSettingsForEdit } from '@/lib/business-settings';

import { SettingsForm } from './_components/settings-form';

export default async function AdminSettingsPage() {
  const settings = await getBusinessSettingsForEdit();

  return (
    <Container className="space-y-6 px-0">
      <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <Text as="p" variant="caption">Business settings</Text>
        <Heading as="h1" size="h2" className="mt-2">Company information</Heading>
        <Text variant="muted" className="mt-2">Manage public company details, social links, and SEO defaults.</Text>
      </div>

      <a href="/admin/security" className="underline">Authenticator and password settings</a>
      <SettingsForm
        initialValues={{
          deliveryRates: settings?.deliveryRates ?? Object.entries(JSON.parse(process.env.DELIVERY_FEES_PAISE || '{}')).map(([pin, fee]) => pin + ' ' + Number(fee) / 100).join('\n'),
          businessName: settings?.businessName ?? 'VISH GARAGE',
          logo: settings?.logo ?? '',
          phone: settings?.phone ?? '',
          email: settings?.email ?? '',
          whatsapp: settings?.whatsapp ?? '',
          instagram: settings?.instagram ?? '',
          facebook: settings?.facebook ?? '',
          youtube: settings?.youtube ?? '',
          address: settings?.address ?? '',
          businessHours: settings?.businessHours ?? '',
          seoTitle: settings?.seoTitle ?? '',
          seoDescription: settings?.seoDescription ?? '',
        }}
      />
    </Container>
  );
}
