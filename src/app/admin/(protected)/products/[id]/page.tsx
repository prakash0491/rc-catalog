import { notFound } from 'next/navigation';

import { Container, Heading, Text } from '@/components/ui';
import { prisma } from '@/lib/prisma';

import { ProductForm } from '../_components/product-form';

type ProductEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditProductPage({ params }: ProductEditPageProps) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <Container className="space-y-6 px-0">
      <div className="space-y-2">
        <Heading as="h1" size="h2">Edit product</Heading>
        <Text variant="muted">Update the product details and replace associated image URLs as needed.</Text>
      </div>

      <ProductForm
        actionUrl={`/api/admin/products/${product.id}`}
        method="PUT"
        submitLabel="Save changes"
        successRedirect="/admin/products"
        categories={categories}
        initialValues={{
          name: product.name,
          slug: product.slug,
          shortDescription: product.shortDescription,
          description: product.description,
          price: product.price.toString(),
          categoryId: product.categoryId,
          featured: product.featured,
          newArrival: product.newArrival,
          isActive: product.isActive,
          stockStatus: product.stockStatus,
          images: product.images.map((image) => image.url),
        }}
      />
    </Container>
  );
}
