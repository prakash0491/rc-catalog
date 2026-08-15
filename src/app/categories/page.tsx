import Link from 'next/link';

import { ImageWithFallback } from '@/components/common/image-with-fallback';
import { ResponsiveContainer, SectionContainer } from '@/components/common';
import { BaseCard, Breadcrumb, Heading, Text } from '@/components/ui';
import { listPublicProductCategories } from '@/lib/products';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const categories = await listPublicProductCategories();

  return (
    <SectionContainer spacing="md">
      <ResponsiveContainer className="space-y-8">
        <header className="space-y-4">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Categories' }]} />
          <div className="space-y-2">
            <Heading as="h1" size="h1">Categories</Heading>
            <Text variant="muted" className="max-w-2xl">
              Explore active product collections backed by the live catalog.
            </Text>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <Link key={category.id} href={`/categories/${category.slug}`} className="group block">
              <BaseCard className="h-full overflow-hidden p-0">
                <div className="relative h-56 bg-slate-100">
                  <ImageWithFallback src={category.image} alt={category.name} fill className="object-cover transition duration-300 group-hover:scale-105" />
                </div>
                <div className="space-y-3 p-6">
                  <Heading as="h2" size="h4">{category.name}</Heading>
                  <Text variant="muted">{category.description ?? 'Browse products in this collection.'}</Text>
                  <Text variant="small" className="font-medium text-slate-900">
                    {category._count.products} products
                  </Text>
                </div>
              </BaseCard>
            </Link>
          ))}
        </div>
      </ResponsiveContainer>
    </SectionContainer>
  );
}
