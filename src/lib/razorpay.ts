import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';
import Razorpay from 'razorpay';

import { CHECKOUT_CURRENCY, toRazorpayAmount } from '@/lib/money';

export class RazorpayConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RazorpayConfigError';
  }
}

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new RazorpayConfigError('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }

  if (!keyId.startsWith('rzp_test_')) {
    throw new RazorpayConfigError('Checkout requires Razorpay test mode.');
  }
  return { keyId, keySecret };
}

let razorpayInstance: Razorpay | null = null;

function getRazorpay() {
  if (!razorpayInstance) {
    const { keyId, keySecret } = getRazorpayCredentials();
    razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  return razorpayInstance;
}

export function getRazorpayKeyId(): string {
  return getRazorpayCredentials().keyId;
}

export async function createRazorpayOrder(params: { receipt: string; amount: number; notes?: Record<string, string> }) {
  const razorpay = getRazorpay();

  return razorpay.orders.create({
    amount: toRazorpayAmount(params.amount, CHECKOUT_CURRENCY),
    currency: CHECKOUT_CURRENCY,
    receipt: params.receipt,
    notes: params.notes,
  });
}

export async function fetchRazorpayPayment(paymentId: string) {
  const razorpay = getRazorpay();
  return razorpay.payments.fetch(paymentId);
}

export async function fetchRazorpayOrder(orderId: string) {
  const razorpay = getRazorpay();
  return razorpay.orders.fetch(orderId);
}

// Verifies the payment signature returned by Razorpay Checkout:
// HMAC-SHA256 of "<order_id>|<payment_id>" signed with the key secret.
export function verifyRazorpayPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const { keySecret } = getRazorpayCredentials();

  const expected = createHmac('sha256', keySecret)
    .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
    .digest('hex');

  const provided = Buffer.from(params.razorpaySignature);
  const computed = Buffer.from(expected);

  if (provided.length !== computed.length) {
    return false;
  }

  return timingSafeEqual(provided, computed);
}

// Verifies the Razorpay webhook signature: HMAC-SHA256 of the raw request
// body signed with the webhook secret.
export function verifyRazorpayWebhookSignature(rawBody: string, signature: string | null): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new RazorpayConfigError('Razorpay webhook secret is not configured. Set RAZORPAY_WEBHOOK_SECRET.');
  }

  if (!signature) {
    return false;
  }

  const expected = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  const provided = Buffer.from(signature);
  const computed = Buffer.from(expected);

  if (provided.length !== computed.length) {
    return false;
  }

  return timingSafeEqual(provided, computed);
}
