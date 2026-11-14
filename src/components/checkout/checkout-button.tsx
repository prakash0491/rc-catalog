'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

import { Alert, PrimaryButton, Text } from '@/components/ui';
import { formatPrice } from '@/lib/money';

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
  handler?: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
};

type CheckoutButtonProps = {
  total: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  businessName: string;
  disabled?: boolean;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function CheckoutButton({
  total,
  currency,
  customerName,
  customerEmail,
  businessName,
  disabled = false,
}: CheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handlePay() {
    setError('');
    setLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        setError('Unable to load the payment gateway. Please try again.');
        setLoading(false);
        return;
      }

      // Create (or reuse) the server-side order with server-calculated totals.
      const createRes = await fetch('/api/checkout/create-order', { method: 'POST' });
      const createData = await createRes.json();

      if (!createData.success) {
        setError(createData.error?.message ?? 'Unable to start checkout. Please try again.');
        setLoading(false);
        return;
      }

      const { keyId, razorpayOrderId, amount, currency: orderCurrency, orderNumber } = createData.data;

      const RazorpayConstructor = window.Razorpay;

      if (!RazorpayConstructor) {
        setError('Unable to load the payment gateway. Please try again.');
        setLoading(false);
        return;
      }

      const rzp = new RazorpayConstructor({
        key: keyId,
        amount,
        currency: orderCurrency,
        order_id: razorpayOrderId,
        name: businessName,
        description: `Order ${orderNumber}`,
        prefill: { name: customerName, email: customerEmail },
        theme: { color: '#0f172a' },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        handler: async (response) => {
          try {
            const verifyRes = await fetch('/api/checkout/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              router.push(`/account/orders/${verifyData.data.orderId}`);
              router.refresh();
            } else {
              setError(verifyData.error?.message ?? 'Payment could not be verified. Please contact support.');
              setLoading(false);
            }
          } catch {
            // The webhook will still finalize the payment server-side; the
            // customer can check their order history.
            setError('Payment received but confirmation was interrupted. Check your order history shortly.');
            setLoading(false);
          }
        },
      });

      rzp.open();
    } catch {
      setError('Unable to start checkout. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error ? (
        <Alert tone="error" role="alert">
          {error}
        </Alert>
      ) : null}

      <PrimaryButton type="button" onClick={handlePay} loading={loading} disabled={disabled} className="w-full gap-2">
        {!loading ? <Lock className="h-4 w-4" /> : null}
        {loading ? 'Preparing payment…' : `Pay ${formatPrice(total, currency)}`}
      </PrimaryButton>

      <Text variant="caption" className="text-center text-slate-400">
        You will be redirected to the secure Razorpay checkout to complete your payment.
      </Text>
    </div>
  );
}

