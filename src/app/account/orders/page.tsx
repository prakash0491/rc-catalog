import { redirect } from 'next/navigation';
import Link from 'next/link';

import { ResponsiveContainer, SectionContainer } from '@/components/common';
import { formatOrderDate, OrderStatusBadge, paymentStatusLabel } from '@/components/orders/order-status';
import { BaseCard, EmptyState, Heading, PrimaryButton, Text } from '@/components/ui';
import { getCustomerSession } from '@/lib/auth/customer-session';
import { formatPrice } from '@/lib/money';
import { getOrdersForCustomer } from '@/lib/orders';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const session = await getCustomerSession();

  if (!session) {
    redirect('/login?next=/account/orders');
  }

  const orders = await getOrdersForCustomer(session.id);

  return (
    <SectionContainer spacing="md">
      <ResponsiveContainer className="space-y-8">
        <header className="space-y-2">
          <Heading as="h1" size="h1">Order history</Heading>
          <Text variant="muted">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'}
          </Text>
        </header>

        {orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="When you place an order it will appear here with its payment status."
            className="rounded-[2rem]"
          >
            <Link href="/products" className="mt-4 inline-block">
              <PrimaryButton type="button">Browse products</PrimaryButton>
            </Link>
          </EmptyState>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const latestPayment = order.payments[0];
              const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

              return (
                <Link key={order.id} href={`/account/orders/${order.id}`} className="block">
                  <BaseCard className="transition hover:-translate-y-0.5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <Heading as="h3" size="h5" className="font-black">{order.orderNumber}</Heading>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <Text variant="muted">{formatOrderDate(order.createdAt)}</Text>
                        <Text variant="caption" className="text-slate-400">
                          {order.items.length} {order.items.length === 1 ? 'line item' : 'line items'} · {itemCount} {itemCount === 1 ? 'unit' : 'units'}
                          {latestPayment ? ` · Payment: ${paymentStatusLabel(latestPayment.status)}` : ''}
                        </Text>
                      </div>
                      <div className="text-right">
                        <Text variant="small" className="font-bold text-slate-900">{formatPrice(Number(order.total))}</Text>
                        <Text variant="caption" className="text-slate-400">View details →</Text>
                      </div>
                    </div>
                  </BaseCard>
                </Link>
              );
            })}
          </div>
        )}
      </ResponsiveContainer>
    </SectionContainer>
  );
}
