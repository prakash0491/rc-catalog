import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

const db = vi.hoisted(() => ({
  payment: { findUnique: vi.fn(), updateMany: vi.fn() },
  order: { updateMany: vi.fn(), findFirst: vi.fn() },
  cart: { findUnique: vi.fn() },
  $transaction: vi.fn(),
}));
const gateway = vi.hoisted(() => ({
  verifyRazorpayPaymentSignature: vi.fn(), fetchRazorpayPayment: vi.fn(),
  fetchRazorpayOrder: vi.fn(), createRazorpayOrder: vi.fn(), getRazorpayKeyId: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({ prisma: db }));
vi.mock('@/lib/razorpay', () => gateway);
import { createCheckoutOrder, finalizePaidOrder, handleRazorpayWebhookEvent, verifyCheckoutPayment } from '@/lib/orders';

const params = { customerId: 'customer', razorpayOrderId: 'rp-order', razorpayPaymentId: 'rp-payment', razorpaySignature: 'signature' };
beforeEach(() => {
  vi.resetAllMocks();
  db.payment.findUnique.mockResolvedValue({ id: 'payment', orderId: 'order', status: 'PENDING', order: { guestSessionId: 'customer', customerId: null, total: new Prisma.Decimal(10), currency: 'INR' } });
  gateway.verifyRazorpayPaymentSignature.mockReturnValue(true);
  gateway.fetchRazorpayPayment.mockResolvedValue({ id: 'rp-payment', order_id: 'rp-order', amount: 1000, currency: 'INR', status: 'captured' });
  db.$transaction.mockResolvedValue({ alreadyProcessed: false });
});

describe('payment verification', () => {
  it('rejects another customer order', async () => {
    await expect(verifyCheckoutPayment({ ...params, customerId: 'attacker' })).rejects.toThrow('ORDER_NOT_FOUND');
    expect(gateway.fetchRazorpayPayment).not.toHaveBeenCalled();
  });
  it('rejects invalid signatures', async () => {
    gateway.verifyRazorpayPaymentSignature.mockReturnValue(false);
    await expect(verifyCheckoutPayment(params)).rejects.toThrow('VERIFICATION_FAILED');
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it.each(['authorized', 'failed', 'refunded', 'created'])('does not finalize %s payments', async (status) => {
    gateway.fetchRazorpayPayment.mockResolvedValue({ order_id: 'rp-order', amount: 1000, currency: 'INR', status });
    await expect(verifyCheckoutPayment(params)).rejects.toThrow('PAYMENT_NOT_CAPTURED');
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it('rejects payments for another provider order', async () => {
    gateway.fetchRazorpayPayment.mockResolvedValue({ order_id: 'another', amount: 1000, currency: 'INR', status: 'captured' });
    await expect(verifyCheckoutPayment(params)).rejects.toThrow('VERIFICATION_FAILED');
  });
  it('records an amount mismatch as captured funds needing a refund', async () => {
    gateway.fetchRazorpayPayment.mockResolvedValue({ order_id: 'rp-order', amount: 999, currency: 'INR', status: 'captured' });
    await expect(verifyCheckoutPayment(params)).rejects.toThrow('AMOUNT_MISMATCH');
    expect(db.payment.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'PAID' }) }));
    expect(db.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'order', status: { in: ['PENDING_PAYMENT', 'PAYMENT_FAILED'] } },
      data: { status: 'REFUND_REQUIRED' },
    });
  });
  it('finalizes a captured payment', async () => {
    await expect(verifyCheckoutPayment(params)).resolves.toEqual({ orderId: 'order', alreadyProcessed: false });
    expect(db.$transaction).toHaveBeenCalledOnce();
  });
  it('preserves idempotency when a concurrent webhook wins', async () => {
    db.$transaction.mockResolvedValue({ alreadyProcessed: true });
    await expect(verifyCheckoutPayment(params)).resolves.toEqual({ orderId: 'order', alreadyProcessed: true });
  });
  it('records captured funds for refund when inventory cannot be reserved', async () => {
    db.$transaction.mockRejectedValueOnce(new Error('STOCK_CONFLICT'));
    await expect(verifyCheckoutPayment(params)).rejects.toThrow('STOCK_CONFLICT');
    expect(db.payment.updateMany).toHaveBeenCalledWith({
      where: { id: 'payment', status: { in: ['PENDING', 'FAILED'] } },
      data: { status: 'PAID', providerPaymentId: 'rp-payment', razorpaySignature: 'signature' },
    });
    expect(db.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'order', status: { in: ['PENDING_PAYMENT', 'PAYMENT_FAILED'] } },
      data: { status: 'REFUND_REQUIRED' },
    });
  });
});

describe('webhooks', () => {
  it('ignores unrelated events', async () => {
    expect(await handleRazorpayWebhookEvent({ event: 'unrelated' })).toEqual({ handled: false });
  });
  it('requires a payment ID and explicit matching currency', async () => {
    expect(await handleRazorpayWebhookEvent({ event: 'payment.captured', payload: { payment: { entity: { order_id: 'rp-order', amount: 1000 } } } })).toEqual({ handled: false });
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it('records payment failures', async () => {
    expect(await handleRazorpayWebhookEvent({ event: 'payment.failed', payload: { payment: { entity: { order_id: 'rp-order' } } } })).toEqual({ handled: true });
    expect(db.payment.updateMany).toHaveBeenCalled();
  });
  it('keeps a captured webhook payment visible when stock reservation fails', async () => {
    db.$transaction.mockRejectedValueOnce(new Error('STOCK_CONFLICT'));
    await expect(
      handleRazorpayWebhookEvent({
        event: 'payment.captured',
        payload: { payment: { entity: { id: 'rp-payment', order_id: 'rp-order', amount: 1000, currency: 'INR' } } },
      })
    ).rejects.toThrow('STOCK_CONFLICT');
    expect(db.payment.updateMany).toHaveBeenCalledWith({
      where: { id: 'payment', status: { in: ['PENDING', 'FAILED'] } },
      data: { status: 'PAID', providerPaymentId: 'rp-payment', razorpaySignature: null },
    });
    expect(db.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'order', status: { in: ['PENDING_PAYMENT', 'PAYMENT_FAILED'] } },
      data: { status: 'REFUND_REQUIRED' },
    });
  });
  it('flags a captured webhook payment with the wrong amount for refund', async () => {
    const result = await handleRazorpayWebhookEvent({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'rp-payment', order_id: 'rp-order', amount: 999, currency: 'INR' } } },
    });
    expect(result).toEqual({ handled: true });
    expect(db.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'order', status: { in: ['PENDING_PAYMENT', 'PAYMENT_FAILED'] } },
      data: { status: 'REFUND_REQUIRED' },
    });
  });
});

describe('checkout order reuse', () => {
  it('does not reuse a same-total order with different products', async () => {
    db.cart.findUnique.mockResolvedValue({ id: 'cart', items: [{ id: 'item', productId: 'new-product', variantId: null, quantity: 1, variant: null, product: { id: 'new-product', slug: 'new', name: 'New product', price: new Prisma.Decimal(10), isActive: true, status: 'PUBLISHED', deletedAt: null, stockQuantity: 5, images: [] } }] });
    db.order.findFirst.mockResolvedValue({ id: 'old-order', total: new Prisma.Decimal(10), currency: 'INR', items: [{ productId: 'old-product', variantId: null, quantity: 1, price: new Prisma.Decimal(10) }], payments: [{ status: 'PENDING', providerOrderId: 'rp-old' }] });
    gateway.fetchRazorpayOrder.mockResolvedValue({ status: 'created' });
    gateway.createRazorpayOrder.mockResolvedValue({ id: 'rp-new' });
    db.$transaction.mockResolvedValue({ id: 'new-order', orderNumber: 'RC-new', payments: [{ providerOrderId: 'rp-new' }] });
    expect((await createCheckoutOrder('customer', { recipientName: 'Buyer', mobile: '9876543210', address: 'Sample address', pinCode: '560001', deliveryFee: 0 })).orderId).toBe('new-order');
    expect(gateway.createRazorpayOrder).toHaveBeenCalledOnce();
  });
});

describe('transactional payment finalization', () => {
  function transaction() {
    const tx = {
      payment: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      order: { update: vi.fn() },
      orderItem: { findMany: vi.fn().mockResolvedValue([{ productId: 'p', variantId: null, quantity: 2 }]) },
      product: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      productVariant: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      cart: { findUnique: vi.fn().mockResolvedValue({ id: 'cart' }) },
      cartItem: { deleteMany: vi.fn(), updateMany: vi.fn() },
    };
    db.$transaction.mockImplementation(async (callback) => callback(tx));
    return tx;
  }
  const finalization = { paymentId: 'payment', orderId: 'order', customerId: 'customer', providerPaymentId: 'rp-payment', razorpaySignature: null };
  it('atomically decrements inventory with a nonnegative guard', async () => {
    const tx = transaction();
    await finalizePaidOrder(finalization);
    expect(tx.product.updateMany).toHaveBeenCalledWith({ where: { id: 'p', stockQuantity: { gte: 2 } }, data: { stockQuantity: { decrement: 2 } } });
  });
  it('does not decrement inventory twice', async () => {
    const tx = transaction();
    tx.payment.updateMany.mockResolvedValue({ count: 0 });
    expect(await finalizePaidOrder(finalization)).toEqual({ alreadyProcessed: true });
    expect(tx.product.updateMany).not.toHaveBeenCalled();
  });
  it('fails the transaction on insufficient inventory', async () => {
    const tx = transaction();
    tx.product.updateMany.mockResolvedValue({ count: 0 });
    await expect(finalizePaidOrder(finalization)).rejects.toThrow('STOCK_CONFLICT');
    expect(tx.cartItem.deleteMany).not.toHaveBeenCalled();
  });
  it('does not clear unrelated or newly added cart quantities', async () => {
    const tx = transaction();
    await finalizePaidOrder(finalization);
    expect(tx.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: 'cart', productId: 'p', variantId: null, quantity: { lte: 2 } } });
    expect(tx.cartItem.updateMany).toHaveBeenCalledWith({ where: { cartId: 'cart', productId: 'p', variantId: null, quantity: { gt: 2 } }, data: { quantity: { decrement: 2 } } });
  });
});
