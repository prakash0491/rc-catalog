import { Container, Heading, Text } from '@/components/ui';

import { CategoryForm } from '../_components/category-form';

export default function AdminCreateCategoryPage() {
  return (
    <Container className="space-y-6 px-0">
      <div className="space-y-2">
        <Heading as="h1" size="h2">Create category</Heading>
        <Text variant="muted">Add a new category using the existing Prisma Category model.</Text>
      </div>

      <CategoryForm
        actionUrl="/api/admin/categories"
        method="POST"
        submitLabel="Create category"
        successRedirect="/admin/categories"
        initialValues={{
          name: '',
          slug: '',
          description: '',
          image: '',
          displayOrder: '0',
          isActive: true,
        }}
      />
    </Container>
  );
}
