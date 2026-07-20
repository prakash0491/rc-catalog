import { Eye } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Badge, Container, Heading, OutlineButton, PrimaryButton, SearchInput, Text } from '@/components/ui';
import { parsePaginationParams, parseQueryParam } from '@/lib/api-utils';
import { getActiveHeroBanner, listAdminBanners } from '@/lib/banners';

import { DeleteBannerButton } from './_components/delete-banner-button';
import { ToggleBannerButton } from './_components/toggle-banner-button';

type BannerPageProps = {
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
  return query ? `/admin/banner?${query}` : '/admin/banner';
}

export default async function AdminBannerPage({ searchParams }: BannerPageProps) {
  const resolvedSearchParams = await searchParams;
  const search = parseQueryParam(resolvedSearchParams?.search);
  const { page, limit } = parsePaginationParams(resolvedSearchParams?.page, resolvedSearchParams?.limit);

  const [bannersData, activeHeroBanner] = await Promise.all([
    listAdminBanners({ search, page, limit }),
    getActiveHeroBanner(),
  ]);

  const filterParams = new URLSearchParams();
  if (search) filterParams.set('search', search);
  if (limit !== 12) filterParams.set('limit', String(limit));

  return (
    <Container className="space-y-8 px-0">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white p-6 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.12)] lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Text as="p" variant="caption">Admin banners</Text>
          <Heading as="h1" size="h2">Banner management</Heading>
          <Text variant="muted">Upload, preview, order, and publish homepage hero banners.</Text>
        </div>

        <div className="text-sm text-slate-500">
          Active homepage banner: <span className="font-semibold text-slate-900">{activeHeroBanner?.title ?? 'None'}</span>
        </div>

        <Link href="/admin/banner/new">
          <PrimaryButton>New banner</PrimaryButton>
        </Link>
      </div>

      {activeHeroBanner ? (
        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[1fr_360px]">
            <div className="space-y-3 p-6">
              <Text as="p" variant="caption">Homepage preview</Text>
              <Heading as="h2" size="h3">{activeHeroBanner.title}</Heading>
              <Text variant="muted">{activeHeroBanner.subtitle ?? 'No subtitle provided.'}</Text>
              {activeHeroBanner.buttonText ? (
                <Text variant="muted">
                  Button: {activeHeroBanner.buttonText} {activeHeroBanner.buttonUrl ? `-> ${activeHeroBanner.buttonUrl}` : ''}
                </Text>
              ) : null}
            </div>
            <Image src={activeHeroBanner.image} alt={activeHeroBanner.title} width={720} height={480} className="h-64 w-full object-cover lg:h-full" />
          </div>
        </section>
      ) : null}

      <form className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto]" method="get">
        <SearchInput name="search" defaultValue={search ?? ''} placeholder="Search banners" />
        <div className="flex gap-3">
          <input type="hidden" name="limit" value={String(limit)} />
          <OutlineButton type="submit" className="w-full lg:w-auto">Apply</OutlineButton>
          <Link href="/admin/banner">
            <OutlineButton type="button" className="w-full lg:w-auto">Reset</OutlineButton>
          </Link>
        </div>
      </form>

      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Banner</th>
                <th className="px-5 py-4 font-semibold">Priority</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Updated</th>
                <th className="px-5 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bannersData.items.length > 0 ? (
                bannersData.items.map((banner) => (
                  <tr key={banner.id} className="align-top">
                    <td className="px-5 py-4">
                      <div className="flex min-w-[320px] gap-4">
                        <Image src={banner.image} alt={banner.title} width={128} height={80} className="h-20 w-32 rounded-xl object-cover" />
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-900">{banner.title}</div>
                          <div className="max-w-lg text-sm leading-6 text-slate-500">{banner.subtitle ?? 'No subtitle provided.'}</div>
                          {banner.buttonText ? <div className="text-xs text-slate-400">{banner.buttonText} {'->'} {banner.buttonUrl ?? '/'}</div> : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">{banner.priority}</td>
                    <td className="px-5 py-4">
                      <Badge tone={banner.isActive ? 'success' : 'error'}>{banner.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">{new Date(banner.updatedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <a href={banner.image} target="_blank" rel="noreferrer">
                          <OutlineButton type="button" className="gap-2">
                            <Eye className="h-4 w-4" aria-hidden="true" />
                            Preview
                          </OutlineButton>
                        </a>
                        <Link href={`/admin/banner/${banner.id}`}>
                          <OutlineButton>Edit</OutlineButton>
                        </Link>
                        <ToggleBannerButton bannerId={banner.id} isActive={banner.isActive} />
                        <DeleteBannerButton bannerId={banner.id} bannerTitle={banner.title} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-10 text-center text-sm text-slate-500" colSpan={5}>
                    No banners found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {bannersData.pagination.totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Text variant="muted">
            Showing page {bannersData.pagination.page} of {bannersData.pagination.totalPages}
          </Text>
          <div className="flex flex-wrap gap-2">
            <Link href={buildPageHref(filterParams, Math.max(1, bannersData.pagination.page - 1))}>
              <OutlineButton type="button" disabled={bannersData.pagination.page === 1}>Previous</OutlineButton>
            </Link>
            {Array.from({ length: bannersData.pagination.totalPages }, (_, index) => index + 1)
              .slice(Math.max(0, bannersData.pagination.page - 3), Math.min(bannersData.pagination.totalPages, bannersData.pagination.page + 2))
              .map((pageNumber) => (
                <Link key={pageNumber} href={buildPageHref(filterParams, pageNumber)}>
                  <PrimaryButton type="button" className={pageNumber === bannersData.pagination.page ? '' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}>
                    {pageNumber}
                  </PrimaryButton>
                </Link>
              ))}
            <Link href={buildPageHref(filterParams, Math.min(bannersData.pagination.totalPages, bannersData.pagination.page + 1))}>
              <OutlineButton type="button" disabled={bannersData.pagination.page === bannersData.pagination.totalPages}>Next</OutlineButton>
            </Link>
          </div>
        </div>
      ) : null}
    </Container>
  );
}
