import 'server-only';

import { NextResponse } from 'next/server';

import { buildApiError, buildApiSuccess } from '@/lib/api-utils';
import { getCustomerSession } from '@/lib/auth/customer-session';

export async function GET() {
  try {
    const session = await getCustomerSession();

    if (!session) {
      return NextResponse.json(buildApiSuccess({ customer: null }));
    }

    return NextResponse.json(
      buildApiSuccess({
        customer: {
          id: session.id,
          email: session.email,
          name: session.name,
        },
      })
    );
  } catch {
    return NextResponse.json(
      buildApiError('Unable to check session.', 'INTERNAL_SERVER_ERROR'),
      { status: 500 }
    );
  }
}