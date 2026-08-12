import Link from 'next/link';

import { Badge, BaseCard, Container, Heading, Text } from '@/components/ui';
import { getAdminDashboardData } from '@/lib/admin-dashboard';

const statLabels = [
  { key: 'totalProducts', label: 'Total products' },
  { key: 'publishedProducts', label: 'Published' },
  { key: 'draftProducts', label: 'Drafts' },
  { key: 'lowStockProducts', label: 'Low stock' },
  { key: 'outOfStockProducts', label: 'Out of stock' },
  { key: 'openInquiries', label: 'Open inquiries' },
] as const;

export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboardData();

  return (
    <Container className="space-y-8 px-0">
      <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <Text as="p" variant="caption">Admin overview</Text>
        <Heading as="h1" size="h2" className="mt-2">Catalog dashboard</Heading>
        <Text variant="muted" className="mt-2">Monitor product publishing, inventory health, and recent customer inquiries.</Text>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statLabels.map((item) => (
          <BaseCard key={item.key}>
            <Text variant="caption">{item.label}</Text>
            <div className="mt-3 text-3xl font-semibold text-slate-900">{dashboard.stats[item.key]}</div>
          </BaseCard>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <BaseCard>
          <div className="mb-5 flex items-center justify-between gap-4">
            <Heading as="h2" size="h3">Recent products</Heading>
            <Link href="/admin/products" className="text-sm font-medium text-blue-600 hover:text-blue-700">View all</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {dashboard.recentProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <Link href={`/admin/products/${product.id}`} className="font-medium text-slate-900 hover:text-blue-700">{product.name}</Link>
                  <Text variant="muted">Stock: {product.stockQuantity}</Text>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge tone={product.status === 'PUBLISHED' ? 'success' : 'warning'}>{product.status}</Badge>
                  <Badge tone={product.stockStatus === 'OUT_OF_STOCK' ? 'error' : product.stockStatus === 'LOW_STOCK' ? 'warning' : 'success'}>{product.stockStatus.replaceAll('_', ' ')}</Badge>
                </div>
              </div>
            ))}
          </div>
        </BaseCard>

        <BaseCard>
          <div className="mb-5 flex items-center justify-between gap-4">
            <Heading as="h2" size="h3">Recent inquiries</Heading>
            <Link href="/admin/inquiries" className="text-sm font-medium text-blue-600 hover:text-blue-700">View all</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {dashboard.recentInquiries.map((inquiry) => (
              <div key={inquiry.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <div className="font-medium text-slate-900">{inquiry.name}</div>
                  <Text variant="muted">{inquiry.productName ?? inquiry.email}</Text>
                </div>
                <Badge tone={inquiry.status === 'CLOSED' ? 'success' : inquiry.status === 'CONTACTED' ? 'info' : 'warning'}>{inquiry.status}</Badge>
              </div>
            ))}
          </div>
        </BaseCard>
      </div>
    </Container>
  );
}
