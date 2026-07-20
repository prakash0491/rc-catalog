import { Container, Heading, Text } from '@/components/ui';

import { BannerForm } from '../_components/banner-form';

export default function AdminCreateBannerPage() {
  return (
    <Container className="space-y-6 px-0">
      <div className="space-y-2">
        <Heading as="h1" size="h2">Create banner</Heading>
        <Text variant="muted">Upload a Cloudinary image and publish a production homepage banner.</Text>
      </div>

      <BannerForm
        actionUrl="/api/admin/banners"
        method="POST"
        submitLabel="Create banner"
        successRedirect="/admin/banner"
        initialValues={{
          title: '',
          subtitle: '',
          image: '',
          buttonText: '',
          buttonUrl: '/products',
          priority: '0',
          isActive: true,
        }}
      />
    </Container>
  );
}
