import Image from 'next/image';
import Link from 'next/link';

import { BaseCard, Container, Heading, IconButton, PrimaryButton, Stack, Text, ErrorState } from '@/components/ui';
import { getPublicContent } from '@/lib/public-content';
import { getPublicFeaturedProducts } from '@/lib/products';
import { formatPrice } from '@/lib/money';

export async function FeaturedProductsSection() {
  try {
    const [products, publicContent] = await Promise.all([
      getPublicFeaturedProducts(8),
      getPublicContent(),
    ]);
    const whatsappNumber = publicContent.businessProfile.whatsapp.replace(/\D/g, '');

    if (products.length === 0) {
      return null;
    }

    return (
      <section className="bg-slate-50/90">
        <Container className="py-14 sm:py-16">
          <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Text variant="caption" className="mb-3 font-bold tracking-[0.28em] text-slate-400">
                Collectibles
              </Text>
              <Heading as="h2" size="h1" className="text-slate-950">
                Featured Products
              </Heading>
              <Text variant="muted" className="mt-2 max-w-2xl">
                Premium picks chosen for quality, detail, and hobby-ready value.
              </Text>
            </div>
            <Link href="/products" className="text-sm font-bold text-slate-950 transition hover:translate-x-1">
              View All →
            </Link>
          </div>

          <div className="premium-scrollbar -mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-5 sm:mx-0 sm:px-0">
            {products.map((product) => (
              <BaseCard key={product.id} className="group relative flex min-w-[265px] snap-start flex-col overflow-hidden p-0 sm:min-w-[300px]">
                <div className="relative h-72 overflow-hidden bg-white">
                  <Image src={product.images[0]} alt={product.name} fill className="object-contain p-7 transition duration-500 group-hover:scale-110" />
                  <span className="absolute left-4 top-4 rounded-full bg-slate-950 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white">
                    {product.newArrival ? 'New' : 'Featured'}
                  </span>
                </div>
                <Stack gap="sm" className="flex-1 p-5">
                  <Heading as="h3" size="h5" className="line-clamp-2 min-h-[44px] text-slate-950">
                    {product.name}
                  </Heading>
                  <Text variant="muted" className="line-clamp-2">
                    {product.shortDescription}
                  </Text>
                  <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                    <span className="text-xl font-black text-slate-950">{formatPrice(product.price)}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Link href={`/products/${product.slug}`} className="flex-1">
                      <PrimaryButton className="w-full">View details</PrimaryButton>
                    </Link>
                    <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I'm interested in ${product.name}`)}`} target="_blank" rel="noreferrer">
                      <IconButton icon={<span aria-hidden="true">M</span>} label={`Message about ${product.name}`} />
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
