import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { Container, Heading, PrimaryButton, SecondaryButton, Stack, Text } from '@/components/ui';
import { getPublicContent } from '@/lib/public-content';

export async function HeroSection() {
  const { heroBanner } = await getPublicContent();

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-12 text-white shadow-[0_24px_80px_rgba(15,23,42,0.16)] sm:px-10 lg:px-16 lg:py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_35%)]" />
      <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <Stack gap="lg">
          <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-slate-200 backdrop-blur">
            Curated catalog experience
          </div>
          <Heading as="h1" size="display" className="max-w-2xl text-white">
            {heroBanner?.title ?? 'Curated products for modern living'}
          </Heading>
          <Text variant="default" className="max-w-xl text-base text-slate-300 sm:text-lg">
            {heroBanner?.subtitle ?? 'Discover a polished catalog experience built for product storytelling and support.'}
          </Text>
          <Stack direction="row" gap="md" className="flex-wrap">
            <Link href={heroBanner?.buttonUrl ?? '/products'}>
              <PrimaryButton className="bg-white text-slate-900 hover:bg-slate-100">
                {heroBanner?.buttonText ?? 'Explore products'}
              </PrimaryButton>
            </Link>
            <Link href="/about">
              <SecondaryButton className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                Learn more
              </SecondaryButton>
            </Link>
          </Stack>
          <div className="flex flex-wrap gap-4 pt-2 text-sm text-slate-300">
            <span>✓ Premium selection</span>
            <span>✓ Fast support</span>
            <span>✓ Trusted experience</span>
          </div>
        </Stack>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative mx-auto w-full max-w-xl"
        >
          <div className="absolute inset-0 -translate-x-2 -translate-y-2 rounded-[2rem] border border-white/10 bg-white/5" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 p-3 shadow-2xl backdrop-blur">
            <Image
              src={heroBanner?.image ?? '/images/placeholder.svg'}
              alt={heroBanner?.title ?? 'Hero banner'}
              width={900}
              height={700}
              priority
              className="h-[360px] w-full rounded-[1.5rem] object-cover sm:h-[440px]"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
