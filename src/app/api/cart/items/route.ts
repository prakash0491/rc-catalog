import 'server-only';

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { buildApiError, buildApiSuccess } from '@/lib/api-utils';
import { getCustomerSession } from '@/lib/auth/customer-session';
import { addItemToCart, getOrCreateCustomerCart, getOrCreateGuestCart } from '@/lib/cart';
import { getOrCreateGuestSessionId, setGuestSessionCookie } from '@/lib/guest-session';

const addItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable().optional().default(null),
  quantity: z.number().int().min(1).default(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = addItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        buildApiError(parsed.error.issues[0]?.message ?? 'Invalid input.', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const { productId, variantId, quantity } = parsed.data;
    const session = await getCustomerSession();

    if (session) {
      const cart = await getOrCreateCustomerCart(session.id);
      const item = await addItemToCart(cart.id, productId, variantId, quantity);
      return NextResponse.json(buildApiSuccess({ item }), { status: 201 });
    }

    // Guest
    const { guestSessionId, isNew } = await getOrCreateGuestSessionId();
    const cart = await getOrCreateGuestCart(guestSessionId);
    const item = await addItemToCart(cart.id, productId, variantId, quantity);

    const response = NextResponse.json(buildApiSuccess({ item }), { status: 201 });

    if (isNew) {
      setGuestSessionCookie(response, guestSessionId);
    }

    return response;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'PRODUCT_NOT_FOUND') {
        return NextResponse.json(buildApiError('Product not found or unavailable.', 'PRODUCT_NOT_FOUND'), { status: 404 });
      }

      if (error.message === 'VARIANT_NOT_FOUND') {
        return NextResponse.json(buildApiError('Product variant not found.', 'VARIANT_NOT_FOUND'), { status: 404 });
      }

      if (error.message === 'INVALID_QUANTITY') {
        return NextResponse.json(buildApiError('Invalid quantity.', 'INVALID_QUANTITY'), { status: 400 });
      }

      if (error.message === 'INSUFFICIENT_STOCK') {
        return NextResponse.json(buildApiError('Insufficient stock.', 'INSUFFICIENT_STOCK'), { status: 409 });
      }
    }

    console.error('Add cart item error:', error);
    return NextResponse.json(buildApiError('Unable to add item to cart.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}