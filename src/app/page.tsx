import {
  HeroSection,
} from "@/components/home/hero-section";

import {
  OffersSection,
} from "@/components/home/offers-section";

import {
  CategoriesSection,
} from "@/components/home/categories-section";

import {
  FeaturedProductsSection,
} from "@/components/home/featured-products-section";

import {
  WhyUsSection,
} from "@/components/home/why-us-section";

import {
  AboutPreviewSection,
} from "@/components/home/about-preview-section";

import {
  FaqPreviewSection,
} from "@/components/home/faq-preview-section";

import {
  ContactCtaSection,
} from "@/components/home/contact-cta-section";

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <>
      <HeroSection />

      <OffersSection />

      <CategoriesSection />

      <FeaturedProductsSection />

      <WhyUsSection />

      <AboutPreviewSection />

      <FaqPreviewSection />

      <ContactCtaSection />
    </>
  );
}
