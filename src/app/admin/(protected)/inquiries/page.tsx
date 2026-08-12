import { InquiryStatus } from '@prisma/client';

import { Badge, BaseCard, Container, Heading, OutlineButton, SearchInput, Select, Text } from '@/components/ui';
import { parsePaginationParams, parseQueryParam } from '@/lib/api-utils';
import { listAdminInquiries } from '@/lib/admin-inquiries';

import { InquiryStatusButton } from './_components/inquiry-status-button';

type AdminInquiriesPageProps = {
  searchParams?: Promise<{
    search?: string;
    status?: string;
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
  return query ? `/admin/inquiries?${query}` : '/admin/inquiries';
}

export default async function AdminInquiriesPage({ searchParams }: AdminInquiriesPageProps) {
  const params = await searchParams;
  const search = parseQueryParam(params?.search);
  const status = params?.status === InquiryStatus.NEW || params?.status === InquiryStatus.CONTACTED || params?.status === InquiryStatus.CLOSED ? params.status : undefined;
  const { page, limit } = parsePaginationParams(params?.page, params?.limit);

  const inquiries = await listAdminInquiries({ search, status, page, limit });
  const filterParams = new URLSearchParams();
  if (search) filterParams.set('search', search);
  if (status) filterParams.set('status', status);
  if (limit !== 10) filterParams.set('limit', String(limit));

  return (
    <Container className="space-y-8 px-0">
      <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <Text as="p" variant="caption">Customer inquiries</Text>
        <Heading as="h1" size="h2" className="mt-2">Inquiry management</Heading>
        <Text variant="muted" className="mt-2">Search requests, track follow-up, and mark conversations resolved.</Text>
      </div>

      <form className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_220px_auto]" method="get">
        <SearchInput name="search" defaultValue={search ?? ''} placeholder="Search inquiries" />
        <Select name="status" defaultValue={status ?? ''}>
          <option value="">All statuses</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="CLOSED">Resolved</option>
        </Select>
        <div className="flex gap-3">
          <input type="hidden" name="limit" value={String(limit)} />
          <OutlineButton type="submit">Apply</OutlineButton>
        </div>
      </form>

      <div className="grid gap-4">
        {inquiries.items.map((inquiry) => (
          <BaseCard key={inquiry.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Heading as="h2" size="h4">{inquiry.name}</Heading>
                  <Badge tone={inquiry.status === 'CLOSED' ? 'success' : inquiry.status === 'CONTACTED' ? 'info' : 'warning'}>{inquiry.status}</Badge>
                </div>
                <Text variant="muted">{inquiry.email}{inquiry.phone ? ` | ${inquiry.phone}` : ''}</Text>
                {inquiry.productName ? <Text variant="small">Product: {inquiry.productName}</Text> : null}
                <Text variant="default">{inquiry.message}</Text>
              </div>
              <div className="flex flex-wrap gap-2">
                <InquiryStatusButton inquiryId={inquiry.id} status={InquiryStatus.CONTACTED} label="Mark contacted" />
                <InquiryStatusButton inquiryId={inquiry.id} status={InquiryStatus.CLOSED} label="Mark resolved" />
              </div>
            </div>
          </BaseCard>
        ))}
      </div>

      {inquiries.pagination.totalPages > 1 ? (
        <div className="flex flex-wrap justify-end gap-2">
          {Array.from({ length: inquiries.pagination.totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <a key={pageNumber} href={buildPageHref(filterParams, pageNumber)} className={`rounded-lg border px-3 py-2 text-sm ${pageNumber === inquiries.pagination.page ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>
              {pageNumber}
            </a>
          ))}
        </div>
      ) : null}
    </Container>
  );
}
