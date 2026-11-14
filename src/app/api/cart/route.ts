import 'server-only';

import { NextResponse } from 'next/server';

import { buildApiError, buildApiSuccess } from '@/lib/api-utils';
import { getCustomerSession } from '@/lib/auth/customer-session';
import { getOrCreateCustomerCart, getOrCreateGuestCart } from '@/lib/cart';
import { getGuestSessionId } from '@/lib/guest-session';
import { CHECKOUT_CURRENCY } from '@/lib/money';

type CartWithItems = Awaited<ReturnType<typeof getOrCreateCustomerCart>>;

// Prisma Decimal values serialize to strings; keep the client contract numeric.
function serializeCart(cart: CartWithItems) {
  return {
    ...cart,
    items: cart.items.map((item) => ({
      ...item,
      product: {
        ...item.product,
        price: Number(item.product.price),
        mrp: item.product.mrp === null ? null : Number(item.product.mrp),
      },
      variant: item.variant
        ? {
            ...item.variant,
            priceOverride: item.variant.priceOverride === null ? null : Number(item.variant.priceOverride),
          }
        : null,
    })),
  };
}

export async function GET() {
  try {
    const session = await getCustomerSession();

    if (session) {
      const cart = await getOrCreateCustomerCart(session.id);
      return NextResponse.json(buildApiSuccess({ cart: serializeCart(cart), currency: CHECKOUT_CURRENCY }));
    }

    const guestSessionId = await getGuestSessionId();

    if (guestSessionId) {
      const cart = await getOrCreateGuestCart(guestSessionId);
      return NextResponse.json(buildApiSuccess({ cart: serializeCart(cart), currency: CHECKOUT_CURRENCY }));
    }

    return NextResponse.json(buildApiSuccess({ cart: null, currency: CHECKOUT_CURRENCY }));
  } catch (error) {
    console.error('Get cart error:', error);
    return NextResponse.json(buildApiError('Unable to load cart.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}