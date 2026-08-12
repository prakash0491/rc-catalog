import 'server-only';

import { NextResponse } from 'next/server';

import { buildApiError, buildApiSuccess } from '@/lib/api-utils';
import { getCustomerSession } from '@/lib/auth/customer-session';
import { getOrderForCustomer } from '@/lib/orders';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCustomerSession();

    if (!session) {
      return NextResponse.json(buildApiError('Authentication required.', 'UNAUTHORIZED'), { status: 401 });
    }

    const { id } = await params;
    const order = await getOrderForCustomer(session.id, id);

    if (!order) {
      return NextResponse.json(buildApiError('Order not found.', 'ORDER_NOT_FOUND'), { status: 404 });
    }

    return NextResponse.json(buildApiSuccess({ order }));
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json(buildApiError('Unable to load order.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}
