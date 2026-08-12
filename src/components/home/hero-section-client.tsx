'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { Container, Heading, PrimaryButton, SecondaryButton, Stack, Text } from '@/components/ui';
import type { PublicContentResponse } from '@/lib/public-content';

type HeroSectionClientProps = {
  heroBanner: PublicContentResponse['heroBanner'];
};

export function HeroSectionClient({ heroBanner }: HeroSectionClientProps) {
  const slides = useMemo(() => [
    {
      title: heroBanner?.title ?? 'Premium RC cars, collectibles, and hobby gear.',
      subtitle: heroBanner?.subtitle ?? 'Explore curated models, upgrades, accessories, and precision collectibles with a polished store experience.',
      image: heroBanner?.image ?? '/images/placeholder.svg',
      href: heroBanner?.buttonUrl ?? '/products',
      buttonText: heroBanner?.buttonText ?? 'Shop collection',
      kicker: 'Clearance picks',
    },
    {
      title: 'Latest arrivals for serious hobbyists.',
      subtitle: 'Fresh products, featured builds, and carefully selected categories made easy to browse.',
      image: heroBanner?.image ?? '/images/placeholder.svg',
      href: '/products?sort=newest',
      buttonText: 'View new arrivals',
      kicker: 'Recently updated',
    },
  ], [heroBanner]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  const activeSlide = slides[activeIndex];

  return (
    <section className="bg-white">
      <Container className="pb-6 pt-4 sm:pb-8">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]"
        >
          <div className="absolute inset-0">
            <Image
              src={activeSlide.image}
              alt={activeSlide.title}
              fill
              priority
              className="object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent" />
          </div>

          <div className="relative z-20 grid min-h-[430px] items-center px-6 py-12 sm:px-10 lg:min-h-[540px] lg:grid-cols-[0.95fr_1.05fr] lg:px-14">
            <Stack gap="lg" className="max-w-2xl">
              <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
                {activeSlide.kicker}
              </div>
              <Heading as="h1" size="display" className="text-white sm:text-6xl">
                {activeSlide.title}
              </Heading>
              <Text variant="default" className="max-w-xl text-base text-white/75 sm:text-lg">
                {activeSlide.subtitle}
              </Text>
              <Stack direction="row" gap="md" className="flex-wrap">
                <Link href={activeSlide.href}>
                  <PrimaryButton className="bg-white text-slate-950 hover:bg-slate-100">
                    {activeSlide.buttonText}
                  </PrimaryButton>
                </Link>
                <Link href="/categories">
                  <SecondaryButton className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                    Browse categories
                  </SecondaryButton>
                </Link>
              </Stack>
            </Stack>
          </div>

          <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.kicker}
                type="button"
                aria-label={`Show slide ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className={`h-2 rounded-full transition ${index === activeIndex ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
