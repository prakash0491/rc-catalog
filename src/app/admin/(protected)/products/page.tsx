import Link from 'next/link';

import { Badge, Container, Heading, OutlineButton, PrimaryButton, SearchInput, Select, Text } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { parsePaginationParams, parseQueryParam } from '@/lib/api-utils';
import { getAdminProductsList } from '@/lib/admin-products';
import { DeleteProductButton } from './_components/delete-product-button';

type ProductsPageProps = {
  searchParams?: Promise<{
    search?: string;
    category?: string;
    page?: string;
    limit?: string;
  }>;
};

function buildSearchHref(baseParams: URLSearchParams, page: number) {
  const params = new URLSearchParams(baseParams);
  if (page > 1) {
    params.set('page', String(page));
  } else {
    params.delete('page');
  }
  const query = params.toString();
  return query ? `/admin/products?${query}` : '/admin/products';
}

export default async function AdminProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const search = parseQueryParam(params?.search);
  const categoryId = parseQueryParam(params?.category);
  const { page, limit } = parsePaginationParams(params?.page, params?.limit);

  const [categories, productsData] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    getAdminProductsList({ search, categoryId, page, limit }),
  ]);

  const filterParams = new URLSearchParams();
  if (search) filterParams.set('search', search);
  if (categoryId) filterParams.set('category', categoryId);
  if (limit !== 10) filterParams.set('limit', String(limit));

  return (
    <Container className="space-y-8 px-0">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white p-6 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.12)] lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Text as="p" variant="caption">Admin products</Text>
          <Heading as="h1" size="h2">Product management</Heading>
          <Text variant="muted">Search, filter, edit, and remove products while keeping the public catalog live.</Text>
        </div>

        <Link href="/admin/products/new">
          <PrimaryButton>New product</PrimaryButton>
        </Link>
      </div>

      <form className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_240px_auto]" method="get">
        <SearchInput name="search" defaultValue={search ?? ''} placeholder="Search products" />
        <Select name="category" defaultValue={categoryId ?? ''}>
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <div className="flex gap-3">
          <input type="hidden" name="limit" value={String(limit)} />
          <OutlineButton type="submit" className="w-full lg:w-auto">Apply</OutlineButton>
          <Link href="/admin/products">
            <OutlineButton type="button" className="w-full lg:w-auto">Reset</OutlineButton>
          </Link>
        </div>
      </form>

      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Product</th>
                <th className="px-5 py-4 font-semibold">Category</th>
                <th className="px-5 py-4 font-semibold">Price</th>
                <th className="px-5 py-4 font-semibold">Flags</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productsData.items.length > 0 ? (
                productsData.items.map((product) => (
                  <tr key={product.id} className="align-top">
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-900">{product.name}</div>
                        <div className="max-w-xl text-sm leading-6 text-slate-500">{product.shortDescription}</div>
                        <div className="text-xs text-slate-400">{product.slug}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">{product.category.name}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">${product.price.toFixed(2)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {product.featured ? <Badge tone="info">Featured</Badge> : null}
                        {product.newArrival ? <Badge tone="default">New</Badge> : null}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={product.isActive ? 'success' : 'error'}>{product.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/products/${product.id}`}>
                          <OutlineButton>Edit</OutlineButton>
                        </Link>
                        <DeleteProductButton productId={product.id} productName={product.name} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-10 text-center text-sm text-slate-500" colSpan={6}>
                    No products found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {productsData.pagination.totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Text variant="muted">
            Showing page {productsData.pagination.page} of {productsData.pagination.totalPages}
          </Text>
          <div className="flex flex-wrap gap-2">
            <Link href={buildSearchHref(filterParams, Math.max(1, productsData.pagination.page - 1))}>
              <OutlineButton type="button" disabled={productsData.pagination.page === 1}>Previous</OutlineButton>
            </Link>
            {Array.from({ length: productsData.pagination.totalPages }, (_, index) => index + 1)
              .slice(Math.max(0, productsData.pagination.page - 3), Math.min(productsData.pagination.totalPages, productsData.pagination.page + 2))
              .map((pageNumber) => (
                <Link key={pageNumber} href={buildSearchHref(filterParams, pageNumber)}>
                  <PrimaryButton type="button" className={pageNumber === productsData.pagination.page ? '' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}>
                    {pageNumber}
                  </PrimaryButton>
                </Link>
              ))}
            <Link href={buildSearchHref(filterParams, Math.min(productsData.pagination.totalPages, productsData.pagination.page + 1))}>
              <OutlineButton type="button" disabled={productsData.pagination.page === productsData.pagination.totalPages}>Next</OutlineButton>
            </Link>
          </div>
        </div>
      ) : null}
    </Container>
  );
}

