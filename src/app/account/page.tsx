import { redirect } from 'next/navigation';
import Link from 'next/link';

import { ResponsiveContainer, SectionContainer } from '@/components/common';
import { formatOrderDate, OrderStatusBadge } from '@/components/orders/order-status';
import { BaseCard, Heading, PrimaryButton, SecondaryButton, Text } from '@/components/ui';
import { getCustomerSession } from '@/lib/auth/customer-session';
import { formatPrice } from '@/lib/money';
import { getRecentOrdersForCustomer } from '@/lib/orders';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const session = await getCustomerSession();

  if (!session) {
    redirect('/login?next=/account');
  }

  const recentOrders = await getRecentOrdersForCustomer(session.id, 3);

  return (
    <SectionContainer spacing="md">
      <ResponsiveContainer className="space-y-8">
        <header className="space-y-2">
          <Heading as="h1" size="h1">My account</Heading>
          <Text variant="muted">Welcome back, {session.name}.</Text>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <BaseCard>
            <div className="space-y-4">
              <Heading as="h2" size="h4">Profile</Heading>
              <div className="space-y-1">
                <Text variant="small" className="font-medium text-slate-900">{session.name}</Text>
                <Text variant="muted">{session.email}</Text>
              </div>
            </div>
          </BaseCard>

          <Link href="/wishlist" className="group block">
            <BaseCard className="transition hover:-translate-y-0.5">
              <div className="space-y-4">
                <Heading as="h2" size="h4">Wishlist</Heading>
                <Text variant="muted">View and manage your saved products.</Text>
                <PrimaryButton type="button" className="group-hover:-translate-y-0">View wishlist</PrimaryButton>
              </div>
            </BaseCard>
          </Link>

          <Link href="/cart" className="group block">
            <BaseCard className="transition hover:-translate-y-0.5">
              <div className="space-y-4">
                <Heading as="h2" size="h4">Cart</Heading>
                <Text variant="muted">Review items in your shopping cart.</Text>
                <PrimaryButton type="button" className="group-hover:-translate-y-0">View cart</PrimaryButton>
              </div>
            </BaseCard>
          </Link>
        </div>

        {/* Recent orders */}
        <BaseCard className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Heading as="h2" size="h4">Recent orders</Heading>
            <Link href="/account/orders" className="text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-950">
              View all orders
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <Text variant="muted">No orders yet. When you place an order it will appear here.</Text>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <Link key={order.id} href={`/account/orders/${order.id}`} className="flex items-center justify-between gap-4 py-3 transition hover:opacity-80">
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Text as="span" variant="small" className="font-bold text-slate-900">{order.orderNumber}</Text>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <Text variant="caption" className="text-slate-400">{formatOrderDate(order.createdAt)}</Text>
                  </div>
                  <Text variant="small" className="font-bold text-slate-900">{formatPrice(Number(order.total))}</Text>
                </Link>
              ))}
            </div>
          )}
        </BaseCard>

        <form action="/api/auth/logout" method="post">
          <SecondaryButton type="submit">Sign out</SecondaryButton>
        </form>
      </ResponsiveContainer>
    </SectionContainer>
  );
}