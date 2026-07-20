import { notFound } from 'next/navigation';

import { ResponsiveContainer, SectionContainer } from '@/components/common';
import {
  ProductBreadcrumb,
  ProductDetails,
  RelatedProducts,
} from '@/components/product';
import { getPublicContent } from '@/lib/public-content';
import { getPublicProductPageData } from '@/lib/products';

type ProductDetailsPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = 'force-dynamic';

export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const { slug } = await params;

  const [data, publicContent] = await Promise.all([
    getPublicProductPageData(slug),
    getPublicContent(),
  ]);

  if (!data) {
    notFound();
  }

  return (
    <SectionContainer spacing="sm">
      <ResponsiveContainer className="space-y-10">
        <ProductBreadcrumb productName={data.product.name} />
        <ProductDetails product={data.product} whatsappNumber={publicContent.businessProfile.whatsapp.replace(/\D/g, '')} />
        <RelatedProducts products={data.relatedProducts} />
      </ResponsiveContainer>
    </SectionContainer>
  );
}
