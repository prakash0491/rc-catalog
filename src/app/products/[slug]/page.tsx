import { notFound } from 'next/navigation';

import { ResponsiveContainer, SectionContainer } from '@/components/common';
import {
  ProductBreadcrumb,
  ProductDetails,
  RelatedProducts,
} from '@/components/product';
import { getCustomerSession } from '@/lib/auth/customer-session';
import { getPublicContent } from '@/lib/public-content';
import { getPublicProductPageData } from '@/lib/products';
import { isProductWishlisted } from '@/lib/wishlist';

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

  const customer = await getCustomerSession();
  const wishlisted = customer ? await isProductWishlisted(customer.id, data.product.id) : false;

  return (
    <SectionContainer spacing="sm">
      <ResponsiveContainer className="space-y-10">
        <ProductBreadcrumb productName={data.product.name} />
        <ProductDetails
          product={data.product}
          whatsappNumber={publicContent.businessProfile.whatsapp.replace(/\D/g, '')}
          initiallyWishlisted={wishlisted}
        />
        <RelatedProducts products={data.relatedProducts} />
      </ResponsiveContainer>
    </SectionContainer>
  );
}