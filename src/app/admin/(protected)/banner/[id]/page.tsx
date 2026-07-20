import { notFound } from 'next/navigation';

import { Container, Heading, Text } from '@/components/ui';
import { getAdminBannerById } from '@/lib/banners';

import { BannerForm } from '../_components/banner-form';

type BannerEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditBannerPage({ params }: BannerEditPageProps) {
  const { id } = await params;
  const banner = await getAdminBannerById(id);

  if (!banner) {
    notFound();
  }

  return (
    <Container className="space-y-6 px-0">
      <div className="space-y-2">
        <Heading as="h1" size="h2">Edit banner</Heading>
        <Text variant="muted">Update the banner content, priority, active state, and Cloudinary image.</Text>
      </div>

      <BannerForm
        actionUrl={`/api/admin/banners/${banner.id}`}
        method="PUT"
        submitLabel="Save changes"
        successRedirect="/admin/banner"
        initialValues={{
          title: banner.title,
          subtitle: banner.subtitle ?? '',
          image: banner.image,
          buttonText: banner.buttonText ?? '',
          buttonUrl: banner.buttonUrl ?? '',
          priority: String(banner.priority),
          isActive: banner.isActive,
        }}
      />
    </Container>
  );
}
