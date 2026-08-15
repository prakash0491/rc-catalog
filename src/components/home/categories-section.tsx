import Link from 'next/link';

import { ImageWithFallback } from '@/components/common/image-with-fallback';
import { Container, Heading, Text } from '@/components/ui';
import { getPublicContent } from '@/lib/public-content';

export async function CategoriesSection() {
  const { categories } = await getPublicContent();

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="bg-white">
      <Container className="py-14 sm:py-16">
        <div className="mb-9 flex items-end justify-between gap-6">
          <div>
            <Text variant="caption" className="mb-3 font-bold tracking-[0.28em] text-slate-400">
              Youcliq categories
            </Text>
            <Heading as="h2" size="h1" className="text-slate-950">
              Shop by Category
            </Heading>
          </div>
          <Link href="/categories" className="hidden text-sm font-bold text-slate-950 transition hover:translate-x-1 sm:inline-flex">
          View All →
          </Link>
        </div>

        <div className="premium-scrollbar -mx-4 flex snap-x gap-6 overflow-x-auto px-4 pb-3 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 lg:grid-cols-4 xl:grid-cols-6">
          {categories.slice(0, 12).map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group flex min-w-[140px] snap-start flex-col items-center text-center"
            >
              <span className="relative grid h-28 w-28 place-items-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.07)] transition duration-300 group-hover:-translate-y-1 group-hover:border-slate-950 group-hover:shadow-[0_22px_55px_rgba(15,23,42,0.12)] sm:h-32 sm:w-32">
                <ImageWithFallback
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="128px"
                  className="object-contain p-5 transition duration-300 group-hover:scale-110"
                />
              </span>
              <span className="mt-4 text-sm font-bold text-slate-950 transition group-hover:text-slate-600">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
