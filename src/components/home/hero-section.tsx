import { getPublicContent } from '@/lib/public-content';

import { HeroSectionClient } from './hero-section-client';

export async function HeroSection() {
  const { heroBanner } = await getPublicContent();

  return <HeroSectionClient heroBanner={heroBanner} />;
}
