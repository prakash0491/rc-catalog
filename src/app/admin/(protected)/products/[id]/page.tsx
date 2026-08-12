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
        specifications: {
          orderBy: { sortOrder: 'asc' },
        },
        variants: {
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
        <Text variant="muted">Update product content, inventory, pricing, SEO, variants, and Cloudinary images.</Text>
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
          mrp: product.mrp?.toString() ?? '',
          discountPercent: String(product.discountPercent),
          sku: product.sku ?? '',
          stockQuantity: String(product.stockQuantity),
          lowStockThreshold: String(product.lowStockThreshold),
          categoryId: product.categoryId,
          featured: product.featured,
          newArrival: product.newArrival,
          bestSeller: product.bestSeller,
          status: product.status,
          isActive: product.isActive,
          stockStatus: product.stockStatus,
          metaTitle: product.metaTitle ?? '',
          metaDescription: product.metaDescription ?? '',
          images: product.images.map((image) => image.url),
          thumbnailImage: product.images.find((image) => image.isThumbnail)?.url ?? product.images[0]?.url ?? '',
          specifications: product.specifications.map((specification) => ({
            name: specification.name,
            value: specification.value,
          })),
          variants: product.variants.map((variant) => ({
            optionName: variant.optionName,
            optionValue: variant.optionValue,
            sku: variant.sku ?? '',
            priceOverride: variant.priceOverride?.toString() ?? '',
            stockQuantity: String(variant.stockQuantity),
            isActive: variant.isActive,
          })),
        }}
      />
    </Container>
  );
}
