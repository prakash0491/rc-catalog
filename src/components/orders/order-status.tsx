import { Badge } from '@/components/ui';

export type OrderStatusValue =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PAYMENT_FAILED'
  | 'CANCELLED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'REFUNDED';

export type PaymentStatusValue = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export function orderStatusLabel(status: OrderStatusValue): string {
  const labels: Record<OrderStatusValue, string> = {
    PENDING_PAYMENT: 'Pending payment',
    PAID: 'Paid',
    PAYMENT_FAILED: 'Payment failed',
    CANCELLED: 'Cancelled',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    REFUNDED: 'Refunded',
  };

  return labels[status] ?? status;
}

export function paymentStatusLabel(status: PaymentStatusValue): string {
  const labels: Record<PaymentStatusValue, string> = {
    PENDING: 'Pending',
    PAID: 'Paid',
    FAILED: 'Failed',
    REFUNDED: 'Refunded',
  };

  return labels[status] ?? status;
}

function orderStatusTone(status: OrderStatusValue): 'success' | 'warning' | 'error' | 'info' | 'default' {
  switch (status) {
    case 'PAID':
    case 'DELIVERED':
      return 'success';
    case 'PENDING_PAYMENT':
    case 'PROCESSING':
    case 'SHIPPED':
      return 'info';
    case 'PAYMENT_FAILED':
      return 'error';
    case 'CANCELLED':
    case 'REFUNDED':
      return 'default';
  }
}

export function OrderStatusBadge({ status }: { status: OrderStatusValue }) {
  return <Badge tone={orderStatusTone(status)}>{orderStatusLabel(status)}</Badge>;
}

export function formatOrderDate(date: Date | string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}
