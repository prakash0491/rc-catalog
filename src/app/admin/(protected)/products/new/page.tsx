import { Container, Heading, Text } from '@/components/ui';
import { prisma } from '@/lib/prisma';

import { ProductForm } from '../_components/product-form';

export default async function AdminCreateProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  });

  return (
    <Container className="space-y-6 px-0">
      <div className="space-y-2">
        <Heading as="h1" size="h2">Create product</Heading>
        <Text variant="muted">Build a new product entry with Cloudinary-hosted images and the existing catalog models.</Text>
      </div>

      <ProductForm
        actionUrl="/api/admin/products"
        method="POST"
        submitLabel="Create product"
        successRedirect="/admin/products"
        categories={categories}
        initialValues={{
          name: '',
          slug: '',
          shortDescription: '',
          description: '',
          price: '0',
          categoryId: categories[0]?.id ?? '',
          featured: false,
          newArrival: false,
          isActive: true,
          stockStatus: 'IN_STOCK',
          images: [],
        }}
      />
    </Container>
  );
}
