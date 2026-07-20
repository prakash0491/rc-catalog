import Image from 'next/image';
import Link from 'next/link';

import { BaseCard, Container, Heading, IconButton, PrimaryButton, SecondaryButton, Stack, Text, ErrorState } from '@/components/ui';
import { getPublicContent } from '@/lib/public-content';
import { getPublicFeaturedProducts } from '@/lib/products';

export async function FeaturedProductsSection() {
  try {
    const [products, publicContent] = await Promise.all([
      getPublicFeaturedProducts(6),
      getPublicContent(),
    ]);
    const whatsappNumber = publicContent.businessProfile.whatsapp.replace(/\D/g, '');

    return (
      <section>
        <Container className="py-8 sm:py-10">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Heading as="h2" size="h2">Featured products</Heading>
              <Text variant="muted">Popular picks chosen for their quality and versatility.</Text>
            </div>
            <Link href="/products">
              <SecondaryButton>View all products</SecondaryButton>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <BaseCard key={product.id} className="flex h-full flex-col overflow-hidden p-0">
                <div className="relative h-56 overflow-hidden">
                  <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                  {product.newArrival ? (
                    <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                      New
                    </span>
                  ) : null}
                </div>
                <Stack gap="sm" className="flex-1 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <Heading as="h3" size="h4">{product.name}</Heading>
                    <span className="text-lg font-semibold text-slate-900">${product.price}</span>
                  </div>
                  <Text variant="muted">{product.shortDescription}</Text>
                  <div className="mt-auto flex flex-wrap gap-3">
                    <Link href={`/products/${product.slug}`}>
                      <PrimaryButton>View details</PrimaryButton>
                    </Link>
                    <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I'm interested in ${product.name}`)}`} target="_blank" rel="noreferrer">
                      <IconButton icon={<span>💬</span>} label={`Contact about ${product.name}`} />
                    </a>
                  </div>
                </Stack>
              </BaseCard>
            ))}
          </div>
        </Container>
      </section>
    );
  } catch {
    return (
      <section>
        <Container className="py-8 sm:py-10">
          <ErrorState title="Unable to load featured products" description="Please try again in a moment." />
        </Container>
      </section>
    );
  }
}
