import Link from 'next/link';

import { ImageWithFallback } from '@/components/common/image-with-fallback';
import { Badge, Container, Heading, OutlineButton, PrimaryButton, SearchInput, Text } from '@/components/ui';
import { parsePaginationParams, parseQueryParam } from '@/lib/api-utils';
import { listCategories } from '@/lib/categories';
import { prisma } from '@/lib/prisma';

import { DeleteCategoryButton } from './_components/delete-category-button';

type CategoriesPageProps = {
  searchParams?: Promise<{
    search?: string;
    page?: string;
    limit?: string;
  }>;
};

function buildPageHref(baseParams: URLSearchParams, page: number) {
  const params = new URLSearchParams(baseParams);
  if (page > 1) {
    params.set('page', String(page));
  } else {
    params.delete('page');
  }

  const query = params.toString();
  return query ? `/admin/categories?${query}` : '/admin/categories';
}

export default async function AdminCategoriesPage({ searchParams }: CategoriesPageProps) {
  const params = await searchParams;
  const search = parseQueryParam(params?.search);
  const { page, limit } = parsePaginationParams(params?.page, params?.limit);

  const [categoriesData, totalProducts] = await Promise.all([
    listCategories({ search, page, limit }),
    prisma.product.count(),
  ]);

  const filterParams = new URLSearchParams();
  if (search) filterParams.set('search', search);
  if (limit !== 12) filterParams.set('limit', String(limit));

  return (
    <Container className="space-y-8 px-0">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white p-6 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.12)] lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Text as="p" variant="caption">Admin categories</Text>
          <Heading as="h1" size="h2">Category management</Heading>
          <Text variant="muted">Search, organize, and maintain the catalog categories.</Text>
        </div>

        <div className="text-sm text-slate-500">
          Total products: <span className="font-semibold text-slate-900">{totalProducts}</span>
        </div>

        <Link href="/admin/categories/new">
          <PrimaryButton>New category</PrimaryButton>
        </Link>
      </div>

      <form className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto]" method="get">
        <SearchInput name="search" defaultValue={search ?? ''} placeholder="Search categories" />
        <div className="flex gap-3">
          <input type="hidden" name="limit" value={String(limit)} />
          <OutlineButton type="submit" className="w-full lg:w-auto">Apply</OutlineButton>
          <Link href="/admin/categories">
            <OutlineButton type="button" className="w-full lg:w-auto">Reset</OutlineButton>
          </Link>
        </div>
      </form>

      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Image</th>
                <th className="px-5 py-4 font-semibold">Category</th>
                <th className="px-5 py-4 font-semibold">Live products</th>
                <th className="px-5 py-4 font-semibold">Order</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categoriesData.items.length > 0 ? (
                categoriesData.items.map((category) => (
                  <tr key={category.id} className="align-top">
                    <td className="px-5 py-4">
                      <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                        <ImageWithFallback
                          src={category.image}
                          alt={category.name}
                          fill
                          sizes="56px"
                          className={category.image ? 'object-cover' : 'object-contain p-2'}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-900">{category.name}</div>
                        <div className="text-xs text-slate-400">{category.slug}</div>
                        <div className="max-w-xl text-sm leading-6 text-slate-500">{category.description ?? 'No description provided.'}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">{category.productCount}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">{category.displayOrder}</td>
                    <td className="px-5 py-4">
                      <Badge tone={category.isActive ? 'success' : 'error'}>{category.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/categories/${category.id}`}>
                          <OutlineButton>Edit</OutlineButton>
                        </Link>
                        <DeleteCategoryButton categoryId={category.id} categoryName={category.name} totalProductCount={category.totalProductCount} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-10 text-center text-sm text-slate-500" colSpan={6}>
                    No categories found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {categoriesData.pagination.totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Text variant="muted">
            Showing page {categoriesData.pagination.page} of {categoriesData.pagination.totalPages}
          </Text>
          <div className="flex flex-wrap gap-2">
            <Link href={buildPageHref(filterParams, Math.max(1, categoriesData.pagination.page - 1))}>
              <OutlineButton type="button" disabled={categoriesData.pagination.page === 1}>Previous</OutlineButton>
            </Link>
            {Array.from({ length: categoriesData.pagination.totalPages }, (_, index) => index + 1)
              .slice(Math.max(0, categoriesData.pagination.page - 3), Math.min(categoriesData.pagination.totalPages, categoriesData.pagination.page + 2))
              .map((pageNumber) => (
                <Link key={pageNumber} href={buildPageHref(filterParams, pageNumber)}>
                  <PrimaryButton type="button" className={pageNumber === categoriesData.pagination.page ? '' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}>
                    {pageNumber}
                  </PrimaryButton>
                </Link>
              ))}
            <Link href={buildPageHref(filterParams, Math.min(categoriesData.pagination.totalPages, categoriesData.pagination.page + 1))}>
              <OutlineButton type="button" disabled={categoriesData.pagination.page === categoriesData.pagination.totalPages}>Next</OutlineButton>
            </Link>
          </div>
        </div>
      ) : null}
    </Container>
  );
}

