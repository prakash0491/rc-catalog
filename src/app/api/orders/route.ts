import 'server-only';

import { NextResponse } from 'next/server';

import { buildApiError, buildApiSuccess } from '@/lib/api-utils';
import { getCustomerSession } from '@/lib/auth/customer-session';
import { getOrdersForCustomer } from '@/lib/orders';

export async function GET() {
  try {
    const session = await getCustomerSession();

    if (!session) {
      return NextResponse.json(buildApiError('Authentication required.', 'UNAUTHORIZED'), { status: 401 });
    }

    const orders = await getOrdersForCustomer(session.id);

    return NextResponse.json(buildApiSuccess({ orders }));
  } catch (error) {
    console.error('List orders error:', error);
    return NextResponse.json(buildApiError('Unable to load orders.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}
