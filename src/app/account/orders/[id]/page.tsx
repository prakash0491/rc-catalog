import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import { ResponsiveContainer, SectionContainer } from '@/components/common';
import {
  formatOrderDate,
  OrderStatusBadge,
  paymentStatusLabel,
} from '@/components/orders/order-status';
import { BaseCard, Heading, SecondaryButton, Text } from '@/components/ui';
import { getCustomerSession } from '@/lib/auth/customer-session';
import { formatPrice } from '@/lib/money';
import { getOrderForCustomer } from '@/lib/orders';

export const dynamic = 'force-dynamic';

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await getCustomerSession();

  if (!session) {
    redirect('/login?next=/account/orders');
  }

  const { id } = await params;
  const order = await getOrderForCustomer(session.id, id);

  if (!order) {
    notFound();
  }

  const latestPayment = order.payments[0];

  return (
    <SectionContainer spacing="md">
      <ResponsiveContainer className="space-y-8">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Heading as="h1" size="h1">{order.orderNumber}</Heading>
            <OrderStatusBadge status={order.status} />
          </div>
          <Text variant="muted">
            Placed on {formatOrderDate(order.createdAt)}
            {latestPayment ? ` · Payment ${paymentStatusLabel(latestPayment.status)}` : ''}
          </Text>
          <Link href="/account/orders" className="inline-block">
            <SecondaryButton type="button">Back to orders</SecondaryButton>
          </Link>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {order.items.map((item) => (
              <BaseCard key={item.id} className="flex gap-4 p-4 sm:gap-6 sm:p-5">
                {item.imageUrl ? (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-50 sm:h-24 sm:w-24">
                    <Image src={item.imageUrl} alt={item.productName} fill className="object-contain p-3" />
                  </div>
                ) : null}

                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                  <div>
                    <Text as="p" className="font-semibold text-slate-900">{item.productName}</Text>
                    {item.variantOptionName ? (
                      <Text variant="caption" className="text-slate-500">
                        {item.variantOptionName}: {item.variantOptionValue}
                      </Text>
                    ) : null}
                    {item.sku ? (
                      <Text variant="caption" className="text-slate-400">SKU: {item.sku}</Text>
                    ) : null}
                    <div className="mt-0.5 flex items-center gap-3">
                      <Text variant="small" className="font-bold text-slate-900">
                        {formatPrice(Number(item.price))}
                      </Text>
                      <Text variant="caption" className="text-slate-400">× {item.quantity}</Text>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Text variant="small" className="font-bold text-slate-900">
                      {formatPrice(Number(item.lineTotal))}
                    </Text>
                  </div>
                </div>
              </BaseCard>
            ))}
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <BaseCard className="space-y-4">
              <Heading as="h2" size="h4">Order summary</Heading>
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatPrice(Number(order.subtotal))}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Shipping</span>
                  <span>Calculated later</span>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="text-xl font-bold text-slate-900">{formatPrice(Number(order.total))}</span>
                </div>
              </div>

              {latestPayment ? (
                <div className="space-y-2 border-t border-slate-100 pt-4 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Payment</span>
                    <span className="font-semibold text-slate-900">{paymentStatusLabel(latestPayment.status)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Provider</span>
                    <span className="font-semibold text-slate-900 capitalize">{latestPayment.provider}</span>
                  </div>
                  {latestPayment.providerPaymentId ? (
                    <div className="flex justify-between gap-4 text-slate-600">
                      <span>Transaction ID</span>
                      <span className="truncate font-semibold text-slate-900">{latestPayment.providerPaymentId}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </BaseCard>
          </div>
        </div>
      </ResponsiveContainer>
    </SectionContainer>
  );
}
