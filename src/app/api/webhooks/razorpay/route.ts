import 'server-only';

import { NextRequest, NextResponse } from 'next/server';

import { handleRazorpayWebhookEvent, type RazorpayWebhookPayload } from '@/lib/orders';
import { RazorpayConfigError, verifyRazorpayWebhookSignature } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  // The raw body must be used for HMAC signature verification.
  const rawBody = await request.text();

  let signature: string | null = null;
  const signatureHeader = request.headers.get('x-razorpay-signature');

  if (typeof signatureHeader === 'string' && signatureHeader.length > 0) {
    signature = signatureHeader;
  }

  try {
    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);

    if (!isValid) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    let payload: RazorpayWebhookPayload;

    try {
      payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
    } catch {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    await handleRazorpayWebhookEvent(payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RazorpayConfigError) {
      console.error('Razorpay webhook config error:', error.message);
      return NextResponse.json({ success: false }, { status: 503 });
    }

    console.error('Razorpay webhook error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
