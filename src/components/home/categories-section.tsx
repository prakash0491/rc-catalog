import Image from 'next/image';
import Link from 'next/link';

import { CategoryCardBase, Container, Heading, Stack, Text } from '@/components/ui';
import { getPublicContent } from '@/lib/public-content';

export async function CategoriesSection() {
  const { categories } = await getPublicContent();

  return (
    <section>
      <Container className="py-6 sm:py-8">
        <div className="mb-8">
          <Heading as="h2" size="h2">Featured categories</Heading>
          <Text variant="muted">Browse collections designed around modern needs.</Text>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.id} href={`/categories/${category.slug}`} className="group block">
              <CategoryCardBase className="h-full overflow-hidden p-0">
                <div className="relative h-48 overflow-hidden">
                  <Image src={category.image} alt={category.name} fill className="object-cover transition duration-300 group-hover:scale-105" />
                </div>
                <Stack gap="sm" className="p-6">
                  <Heading as="h3" size="h4">{category.name}</Heading>
                  <Text variant="muted">{category.shortDescription}</Text>
                </Stack>
              </CategoryCardBase>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
