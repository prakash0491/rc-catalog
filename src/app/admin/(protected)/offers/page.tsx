import { Badge, BaseCard, Container, Heading, Text } from '@/components/ui';
import { listAdminOffers } from '@/lib/offers';

import { DeleteOfferButton, OfferCreateForm } from './_components/offer-actions';

export default async function AdminOffersPage() {
  const offers = await listAdminOffers({ page: 1, limit: 20 });

  return (
    <Container className="space-y-8 px-0">
      <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <Text as="p" variant="caption">Homepage controls</Text>
        <Heading as="h1" size="h2" className="mt-2">Offers</Heading>
        <Text variant="muted" className="mt-2">Create and manage promotional offers shown on the public homepage.</Text>
      </div>

      <OfferCreateForm />

      <div className="grid gap-4">
        {offers.items.map((offer) => (
          <BaseCard key={offer.id}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <Heading as="h2" size="h4">{offer.title}</Heading>
                  <Badge tone={offer.isActive ? 'success' : 'error'}>{offer.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
                <Text variant="muted" className="mt-2">{offer.description ?? 'No description.'}</Text>
                <Text variant="small" className="mt-2">Priority: {offer.priority}</Text>
              </div>
              <DeleteOfferButton offerId={offer.id} />
            </div>
          </BaseCard>
        ))}
      </div>
    </Container>
  );
}
