import 'server-only';

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { buildApiError, buildApiSuccess } from '@/lib/api-utils';
import { getCustomerSession } from '@/lib/auth/customer-session';
import { getOrCreateCustomerCart, getOrCreateGuestCart, updateCartItemQuantity, removeCartItem } from '@/lib/cart';
import { getGuestSessionId } from '@/lib/guest-session';

const updateSchema = z.object({
  quantity: z.number().int().min(0).max(100000, 'Quantity is too large.'),
});

async function getCartForCurrentUser() {
  const session = await getCustomerSession();

  if (session) {
    return getOrCreateCustomerCart(session.id);
  }

  const guestSessionId = await getGuestSessionId();

  if (guestSessionId) {
    return getOrCreateGuestCart(guestSessionId);
  }

  return null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        buildApiError(parsed.error.issues[0]?.message ?? 'Invalid input.', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const cart = await getCartForCurrentUser();

    if (!cart) {
      return NextResponse.json(buildApiError('Cart not found.', 'CART_NOT_FOUND'), { status: 404 });
    }

    // Verify item belongs to this cart
    const item = cart.items.find((item) => item.id === id);

    if (!item) {
      return NextResponse.json(buildApiError('Item not found in cart.', 'ITEM_NOT_FOUND'), { status: 404 });
    }

    const { quantity } = parsed.data;
    const updated = await updateCartItemQuantity(id, cart.id, quantity);

    return NextResponse.json(buildApiSuccess({ item: updated }));
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_QUANTITY') {
      return NextResponse.json(buildApiError('Invalid quantity.', 'INVALID_QUANTITY'), { status: 400 });
    }
    if (error instanceof Error && error.message === 'CART_ITEM_NOT_FOUND') {
      return NextResponse.json(buildApiError('Item not found in cart.', 'ITEM_NOT_FOUND'), { status: 404 });
    }
    if (error instanceof Error && error.message === 'INSUFFICIENT_STOCK') {
      return NextResponse.json(buildApiError('Requested quantity exceeds available stock.', 'INSUFFICIENT_STOCK'), { status: 409 });
    }
    console.error('Update cart item error:', error);
    return NextResponse.json(buildApiError('Unable to update cart item.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cart = await getCartForCurrentUser();

    if (!cart) {
      return NextResponse.json(buildApiError('Cart not found.', 'CART_NOT_FOUND'), { status: 404 });
    }

    const item = cart.items.find((item) => item.id === id);

    if (!item) {
      return NextResponse.json(buildApiError('Item not found in cart.', 'ITEM_NOT_FOUND'), { status: 404 });
    }

    await removeCartItem(id, cart.id);
    return NextResponse.json(buildApiSuccess({ removed: true }));
  } catch (error) {
    console.error('Remove cart item error:', error);
    return NextResponse.json(buildApiError('Unable to remove cart item.', 'INTERNAL_SERVER_ERROR'), { status: 500 });
  }
}
