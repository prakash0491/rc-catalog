import { notFound } from 'next/navigation';

import { Container, Heading, Text } from '@/components/ui';
import { getCategoryForEdit } from '@/lib/categories';

import { CategoryForm } from '../_components/category-form';

type CategoryEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditCategoryPage({ params }: CategoryEditPageProps) {
  const { id } = await params;
  const category = await getCategoryForEdit(id);

  if (!category) {
    notFound();
  }

  return (
    <Container className="space-y-6 px-0">
      <div className="space-y-2">
        <Heading as="h1" size="h2">Edit category</Heading>
        <Text variant="muted">Update the category details and display order.</Text>
      </div>

      <CategoryForm
        actionUrl={`/api/admin/categories/${category.id}`}
        method="PUT"
        submitLabel="Save changes"
        successRedirect="/admin/categories"
        initialValues={{
          name: category.name,
          slug: category.slug,
          description: category.description ?? '',
          image: category.image ?? '',
          displayOrder: String(category.displayOrder),
          isActive: category.isActive,
        }}
      />
    </Container>
  );
}
