import 'server-only';

import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { CHECKOUT_CURRENCY, toRazorpayAmount } from '@/lib/money';
import {
  createRazorpayOrder,
  fetchRazorpayOrder,
  fetchRazorpayPayment,
  getRazorpayKeyId,
  verifyRazorpayPaymentSignature,
} from '@/lib/razorpay';

// ─── Types ──────────────────────────────────────────────────

export type CheckoutCartItem = {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  product: {
    id: string;
    slug: string;
    name: string;
    sku: string | null;
    stockQuantity: number;
    images: Array<{ url: string }>;
  };
  variant: {
    id: string;
    optionName: string;
    optionValue: string;
    sku: string | null;
    priceOverride: number | null;
    stockQuantity: number;
  } | null;
  unitPrice: number;
  lineTotal: number;
  unavailable: string | null;
};

export type CheckoutCart = {
  items: CheckoutCartItem[];
  subtotal: number;
  total: number;
  currency: string;
};

type LoadedCartItem = {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  product: {
    id: string;
    slug: string;
    name: string;
    sku: string | null;
    stockQuantity: number;
    images: Array<{ url: string }>;
  };
  variant: {
    id: string;
    optionName: string;
    optionValue: string;
    sku: string | null;
    priceOverride: Prisma.Decimal | null;
    stockQuantity: number;
  } | null;
  unitPrice: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
  unavailable: string | null;
};

// ─── Server-side cart loading & validation ──────────────────

async function loadCheckoutCartRaw(guestSessionId: string): Promise<{
  cartId: string;
  items: LoadedCartItem[];
  subtotal: Prisma.Decimal;
  total: Prisma.Decimal;
} | null> {
  const cart = await prisma.cart.findUnique({
    where: { guestSessionId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              name: true,
              price: true,
              mrp: true,
              sku: true,
              stockQuantity: true,
              isActive: true,
              status: true,
              deletedAt: true,
              images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } },
            },
          },
          variant: {
            select: {
              id: true,
              optionName: true,
              optionValue: true,
              sku: true,
              priceOverride: true,
              stockQuantity: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (!cart) {
    return null;
  }

  const items: LoadedCartItem[] = [];
  let subtotal = new Prisma.Decimal(0);

  for (const item of cart.items) {
    let unavailable: string | null = null;
    const product = item.product;
    const variant = item.variant;

    if (!product.isActive || product.status !== 'PUBLISHED' || product.deletedAt !== null) {
      unavailable = 'This product is no longer available.';
    } else if (item.variantId && (!variant || !variant.isActive)) {
      unavailable = 'This option is no longer available.';
    } else {
      const availableStock = variant ? variant.stockQuantity : product.stockQuantity;

      if (item.quantity > availableStock) {
        unavailable =
          availableStock > 0 ? `Only ${availableStock} left in stock.` : 'This item is currently out of stock.';
      }
    }

    const unitPrice = variant?.priceOverride ?? product.price;
    const lineTotal = unitPrice.mul(item.quantity);
    subtotal = subtotal.add(lineTotal);

    items.push({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      product: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        sku: product.sku,
        stockQuantity: product.stockQuantity,
        images: product.images,
      },
      variant: variant
        ? {
            id: variant.id,
            optionName: variant.optionName,
            optionValue: variant.optionValue,
            sku: variant.sku,
            priceOverride: variant.priceOverride,
            stockQuantity: variant.stockQuantity,
          }
        : null,
      unitPrice,
      lineTotal,
      unavailable,
    });
  }

  return {
    cartId: cart.id,
    items,
    subtotal,
    total: subtotal,
  };
}

export async function loadCheckoutCart(customerId: string): Promise<CheckoutCart | null> {
  const raw = await loadCheckoutCartRaw(customerId);

  if (!raw) {
    return null;
  }

  return {
    items: raw.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      product: item.product,
      variant: item.variant
        ? {
            ...item.variant,
            priceOverride: item.variant.priceOverride === null ? null : Number(item.variant.priceOverride),
          }
        : null,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
      unavailable: item.unavailable,
    })),
    subtotal: Number(raw.subtotal),
    total: Number(raw.total),
    currency: CHECKOUT_CURRENCY,
  };
}

// ─── Order number ───────────────────────────────────────────

function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RC-${timestamp}${random}`;
}

// ─── Order creation ─────────────────────────────────────────

function assertCartReady(raw: { items: LoadedCartItem[] }) {
  if (raw.items.length === 0) {
    throw new Error('CART_EMPTY');
  }

  const unavailableItem = raw.items.find((item) => item.unavailable !== null);

  if (unavailableItem) {
    throw new Error('ITEM_UNAVAILABLE');
  }
}

async function findReusablePendingOrder(guestSessionId: string, checkoutKey: string, raw: { total: Prisma.Decimal; items: LoadedCartItem[] }) {
  const order = await prisma.order.findFirst({
    where: { guestSessionId, checkoutKey, status: { in: ['PENDING_PAYMENT', 'PAYMENT_FAILED'] } },
    orderBy: { createdAt: 'desc' },
    include: { items: true, payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });

  if (!order) {
    return null;
  }

  const payment = order.payments[0];

  if (!payment || !['PENDING', 'FAILED'].includes(payment.status) || !payment.providerOrderId || payment.providerPaymentId) {
    return null;
  }

  if (!order.total.equals(raw.total) || order.currency !== CHECKOUT_CURRENCY) {
    return null;
  }

  // Equal totals do not imply the same purchase. Match immutable line snapshots.
  if (order.items.length !== raw.items.length || !raw.items.every((item) =>
    order.items.some((saved) => saved.productId === item.productId &&
      saved.variantId === item.variantId && saved.quantity === item.quantity && saved.price.equals(item.unitPrice))
  )) {
    return null;
  }

  // Only reuse a Razorpay order that is still open.
  try {
    const razorpayOrder = await fetchRazorpayOrder(payment.providerOrderId);
    if (!['created', 'attempted'].includes(razorpayOrder.status)) {
      return null;
    }
  } catch {
    return null;
  }

  return { order, payment };
}

export type CreateCheckoutOrderResult = {
  orderId: string;
  orderNumber: string;
  razorpayOrderId: string;
  keyId: string;
  amount: number;
  currency: string;
};

type Delivery = { recipientName: string; mobile: string; address: string; pinCode: string; deliveryFee: number };

export async function createCheckoutOrder(guestSessionId: string, delivery: Delivery): Promise<CreateCheckoutOrderResult> {
  const raw = await loadCheckoutCartRaw(guestSessionId);

  if (!raw) {
    throw new Error('CART_EMPTY');
  }

  assertCartReady(raw);
  raw.total = raw.subtotal.add(delivery.deliveryFee);

  // A unique snapshot key lets only one concurrent attempt return a payable order.
  const lines = raw.items.map(item => [item.id, item.quantity, item.unitPrice.toString()]).sort();
  const checkoutKey = createHash('sha256').update(JSON.stringify([guestSessionId, delivery, lines])).digest('hex');
  const orderNumber = generateOrderNumber();

  // Reuse an open pending order for the same cart snapshot so that
  // refreshes / re-opened checkouts do not create duplicate orders.
  const reusable = await findReusablePendingOrder(guestSessionId, checkoutKey, raw);

  if (reusable) {
    return {
      orderId: reusable.order.id,
      orderNumber: reusable.order.orderNumber,
      razorpayOrderId: reusable.payment.providerOrderId,
      keyId: getRazorpayKeyId(),
      amount: toRazorpayAmount(Number(raw.total), reusable.order.currency),
      currency: reusable.order.currency,
    };
  }

  const razorpayOrder = await createRazorpayOrder({
    receipt: orderNumber,
    amount: Number(raw.total),
  });

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        checkoutKey,
        guestSessionId,
        ...delivery,
        status: 'PENDING_PAYMENT',
        subtotal: raw.subtotal,
        total: raw.total,
        currency: CHECKOUT_CURRENCY,
        items: {
          create: raw.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.product.name,
            productSlug: item.product.slug,
            sku: item.variant?.sku ?? item.product.sku,
            variantOptionName: item.variant?.optionName ?? null,
            variantOptionValue: item.variant?.optionValue ?? null,
            imageUrl: item.product.images[0]?.url ?? null,
            price: item.unitPrice,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
          })),
        },
        payments: {
          create: {
            provider: 'razorpay',
            providerOrderId: razorpayOrder.id,
            amount: raw.total,
            currency: CHECKOUT_CURRENCY,
            status: 'PENDING',
          },
        },
      },
      include: { payments: true },
    });

    return created;
  });

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    razorpayOrderId: order.payments[0].providerOrderId,
    keyId: getRazorpayKeyId(),
    amount: toRazorpayAmount(Number(raw.total), CHECKOUT_CURRENCY),
    currency: CHECKOUT_CURRENCY,
  };
}

// ─── Payment finalization (shared by verification & webhook) ─

async function markPaymentFailed(paymentId: string, orderId: string) {
  await prisma.$transaction([
    prisma.payment.updateMany({
      where: { id: paymentId, status: { in: ['PENDING', 'FAILED'] } },
      data: { status: 'FAILED' },
    }),
    prisma.order.updateMany({
      where: { id: orderId, status: 'PENDING_PAYMENT' },
      data: { status: 'PAYMENT_FAILED' },
    }),
  ]);
}

/**
 * The provider captured the money, but the order could not reserve stock.
 * Recording the charge as PAID (instead of FAILED) keeps the ledger honest and
 * marks the order for a manual refund. Never call markPaymentFailed here.
 */
async function markCapturedPaymentForRefund(params: {
  paymentId: string;
  orderId: string;
  providerPaymentId: string;
  razorpaySignature: string | null;
}) {
  await prisma.$transaction([
    prisma.payment.updateMany({
      where: { id: params.paymentId, status: { in: ['PENDING', 'FAILED'] } },
      data: {
        status: 'PAID',
        providerPaymentId: params.providerPaymentId,
        razorpaySignature: params.razorpaySignature,
      },
    }),
    prisma.order.updateMany({
      where: { id: params.orderId, status: { in: ['PENDING_PAYMENT', 'PAYMENT_FAILED'] } },
      data: { status: 'REFUND_REQUIRED' },
    }),
  ]);

  console.error(
    `Captured payment ${params.providerPaymentId} for order ${params.orderId} could not reserve inventory. ` +
      'Order marked REFUND_REQUIRED; issue a refund in the payment provider dashboard.'
  );
}

export async function finalizePaidOrder(params: {
  paymentId: string;
  orderId: string;
  guestSessionId?: string | null;
  customerId: string | null;
  providerPaymentId: string;
  razorpaySignature: string | null;
}) {
  const { paymentId, orderId, customerId, providerPaymentId, razorpaySignature } = params;

  return prisma.$transaction(async (tx) => {
    const paymentUpdate = await tx.payment.updateMany({
      where: { id: paymentId, status: { in: ['PENDING', 'FAILED'] } },
      data: { status: 'PAID', providerPaymentId, razorpaySignature },
    });

    if (paymentUpdate.count === 0) {
      // Already finalized (duplicate verification / webhook).
      return { alreadyProcessed: true };
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: 'PAID' },
    });

    const orderItems = await tx.orderItem.findMany({ where: { orderId } });

    // Decrement inventory atomically; never allow stock to go negative.
    for (const item of orderItems) {
      if (item.variantId) {
        const updated = await tx.productVariant.updateMany({
          where: { id: item.variantId, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } },
        });

        if (updated.count === 0) {
          throw new Error('STOCK_CONFLICT');
        }
      } else {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } },
        });

        if (updated.count === 0) {
          throw new Error('STOCK_CONFLICT');
        }
      }
    }

    // Clear purchased items from the customer's cart. The cart row itself is kept.
    const owner = customerId ? { customerId } : params.guestSessionId ? { guestSessionId: params.guestSessionId } : null;
    const cart = owner ? await tx.cart.findUnique({ where: owner }) : null;

    if (cart) {
      // A delayed webhook must not erase items added after checkout started.
      for (const item of orderItems) {
        const where = { cartId: cart.id, productId: item.productId, variantId: item.variantId };
        await tx.cartItem.deleteMany({ where: { ...where, quantity: { lte: item.quantity } } });
        await tx.cartItem.updateMany({
          where: { ...where, quantity: { gt: item.quantity } },
          data: { quantity: { decrement: item.quantity } },
        });
      }
    }

    return { alreadyProcessed: false };
  });
}

// ─── Payment verification ───────────────────────────────────

export async function verifyCheckoutPayment(params: {
  customerId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<{ orderId: string; alreadyProcessed: boolean }> {
  const { customerId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

  const payment = await prisma.payment.findUnique({
    where: { providerOrderId: razorpayOrderId },
    include: { order: true },
  });

  if (!payment || payment.order.guestSessionId !== customerId) {
    throw new Error('ORDER_NOT_FOUND');
  }

  if (payment.status === 'PAID') {
    if (payment.order.status === 'REFUND_REQUIRED') throw new Error('STOCK_CONFLICT');
    // Idempotent: the payment is already finalized.
    return { orderId: payment.orderId, alreadyProcessed: true };
  }

  if (
    !verifyRazorpayPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    })
  ) {
    throw new Error('VERIFICATION_FAILED');
  }

  // Confirm the amount charged matches the server-calculated order total.
  const razorpayPayment = await fetchRazorpayPayment(razorpayPaymentId);
  if (razorpayPayment.order_id !== razorpayOrderId) {
    throw new Error('VERIFICATION_FAILED');
  }

  if (razorpayPayment.status !== 'captured') {
    // Authorization alone is not settled payment. Leave pending captures
    // available for the capture webhook rather than marking them failed.
    throw new Error('PAYMENT_NOT_CAPTURED');
  }
  const expectedAmount = toRazorpayAmount(Number(payment.order.total), payment.order.currency);

  if (
    Number(razorpayPayment.amount) !== expectedAmount ||
    razorpayPayment.currency !== payment.order.currency
  ) {
    await markCapturedPaymentForRefund({
      paymentId: payment.id,
      orderId: payment.orderId,
      providerPaymentId: razorpayPaymentId,
      razorpaySignature,
    });
    throw new Error('AMOUNT_MISMATCH');
  }

  try {
    const result = await finalizePaidOrder({
      paymentId: payment.id,
      orderId: payment.orderId,
      customerId: payment.order.customerId,
      guestSessionId: payment.order.guestSessionId,
      providerPaymentId: razorpayPaymentId,
      razorpaySignature,
    });
    return { orderId: payment.orderId, alreadyProcessed: result.alreadyProcessed };
  } catch (error) {
    if (error instanceof Error && error.message === 'STOCK_CONFLICT') {
      await markCapturedPaymentForRefund({
        paymentId: payment.id,
        orderId: payment.orderId,
        providerPaymentId: razorpayPaymentId,
        razorpaySignature,
      });
      throw error;
    }
    throw error;
  }

}

// ─── Webhook handling ───────────────────────────────────────

export type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
        currency?: string;
        status?: string;
      };
    };
  };
};

export async function handleRazorpayWebhookEvent(payload: RazorpayWebhookPayload): Promise<{ handled: boolean }> {
  const event = payload.event;
  const paymentEntity = payload.payload?.payment?.entity;

  if (!paymentEntity?.order_id) {
    return { handled: false };
  }

  const payment = await prisma.payment.findUnique({
    where: { providerOrderId: paymentEntity.order_id },
    include: { order: true },
  });

  if (!payment) {
    return { handled: false };
  }

  // payment.captured → finalize the order (idempotent).
  if (event === 'payment.captured') {
    if (!paymentEntity.id || !paymentEntity.currency) {
      return { handled: false };
    }
    if (payment.status === 'PAID') {
      return { handled: true };
    }

    const expectedAmount = toRazorpayAmount(Number(payment.order.total), payment.order.currency);

    if (
      Number(paymentEntity.amount ?? 0) !== expectedAmount ||
      (paymentEntity.currency && paymentEntity.currency !== payment.order.currency)
    ) {
      // The provider captured money, but not the amount we asked for.
      // Never mark this as a failed payment; flag it for manual refund.
      console.error(
        `Razorpay webhook amount mismatch for order ${payment.order.orderNumber}: ` +
          `expected ${expectedAmount} ${payment.order.currency}, got ${paymentEntity.amount} ${paymentEntity.currency}`
      );
      await markCapturedPaymentForRefund({
        paymentId: payment.id,
        orderId: payment.orderId,
        providerPaymentId: paymentEntity.id,
        razorpaySignature: null,
      });
      return { handled: true };
    }

    try {
      await finalizePaidOrder({
        paymentId: payment.id,
        orderId: payment.orderId,
        customerId: payment.order.customerId,
      guestSessionId: payment.order.guestSessionId,
        providerPaymentId: paymentEntity.id,
        razorpaySignature: null,
      });
      return { handled: true };
    } catch (error) {
      if (error instanceof Error && error.message === 'STOCK_CONFLICT') {
        await markCapturedPaymentForRefund({
          paymentId: payment.id,
          orderId: payment.orderId,
          providerPaymentId: paymentEntity.id,
          razorpaySignature: null,
        });
        return { handled: true };
      }
      throw error;
    }
  }

  // payment.failed → record the failure.
  if (event === 'payment.failed') {
    if (payment.status === 'PENDING') {
      await markPaymentFailed(payment.id, payment.orderId);
    }
    return { handled: true };
  }

  return { handled: false };
}

// ─── Order history ──────────────────────────────────────────

const orderInclude = {
  items: { orderBy: { createdAt: 'asc' as const } },
  payments: { orderBy: { createdAt: 'desc' as const }, take: 1 },
} as const;

export async function getOrdersForCustomer(customerId: string) {
  return prisma.order.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    include: orderInclude,
  });
}

export async function getOrderForCustomer(customerId: string, orderId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, customerId },
    include: orderInclude,
  });
}

export async function getRecentOrdersForCustomer(customerId: string, limit = 3) {
  return prisma.order.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: orderInclude,
  });
}

export type OrderWithDetails = Awaited<ReturnType<typeof getOrderForCustomer>>;
