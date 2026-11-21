'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

import { Alert, PrimaryButton, Text } from '@/components/ui';
import { formatPrice, toRazorpayAmount } from '@/lib/money';

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
  businessName,
  disabled = false,
}: CheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [details, setDetails] = useState({ recipientName: '', address: '', mobile: '', pinCode: '' });
  const [quote, setQuote] = useState<{ pin: string; fee: number } | null>(null);
  const quoteRequest = useRef(0);
  const fee = quote?.pin === details.pinCode ? quote.fee : null;

  async function checkDelivery(pin = details.pinCode) {
    const request = ++quoteRequest.current;
    if (!/^[1-9][0-9]{5}$/.test(pin)) { setError('Enter a six-digit delivery PIN code.'); return; }

    setQuote(null);
    setError('');
    try {
      const response = await fetch('/api/checkout/quote?pin=' + encodeURIComponent(pin));
      const result = await response.json();
      if (request !== quoteRequest.current) return;
      if (!response.ok || (result.fee !== null && (!Number.isSafeInteger(result.fee) || result.fee < 0))) {
        throw new Error('Invalid delivery quote');
      }
      if (result.fee === null) {
        setError('Delivery unavailable for this PIN code.');
        return;
      }
      setQuote({ pin, fee: result.fee });
    } catch {
      if (request === quoteRequest.current) setError('Could not check delivery. Try again.');
    }
  }

  async function handlePay() {
    if (!/^[6-9][0-9]{9}$/.test(details.mobile)) {
      setError('Enter a 10-digit Indian mobile number starting with 6, 7, 8 or 9.');
      return;
    }
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
      const createRes = await fetch('/api/checkout/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(details) });
      const createData = await createRes.json();

      if (!createData.success) {
        setError(createData.error?.message ?? 'Unable to start checkout. Please try again.');
        setLoading(false);
        return;
      }

      const { keyId, razorpayOrderId, amount, currency: orderCurrency, orderNumber } = createData.data;

      if (fee === null || orderCurrency !== currency || amount !== toRazorpayAmount(total + fee / 100, currency)) {
        setError('Pricing changed. Refresh checkout to review the new total.');
        setLoading(false);
        return;
      }
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
        prefill: { name: details.recipientName },
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
              router.push(`/confirmation/${verifyData.data.orderId}`);
              router.refresh();
            } else {
              setError(verifyData.error?.message ?? 'Payment could not be verified. Please contact support.');
              setLoading(false);
            }
          } catch {
            // The webhook will still finalize the payment server-side; the
            // customer can check their order history.
            setError('Payment received but confirmation was interrupted. Contact the store before retrying.');
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
      {([['recipientName', 'Full name'], ['mobile', 'Mobile number'], ['address', 'Complete delivery address'], ['pinCode', 'PIN code']] as const).map(([key, label]) => (
        <label key={key} className="block text-sm">{label}
          <input className="block w-full rounded border p-2" disabled={loading} value={details[key]} onChange={(event) => {
            if (key === 'pinCode') {
              quoteRequest.current++;
              setQuote(null);
              setError('');
            }
            const value = event.target.value;
            setDetails({ ...details, [key]: value });
            if (key === 'pinCode' && /^[1-9][0-9]{5}$/.test(value)) void checkDelivery(value);
          }} />
        </label>
      ))}
      <button type="button" disabled={loading} className="rounded-lg border px-4 py-2 font-semibold" onClick={() => checkDelivery()}>Check delivery</button>
      {fee === null && !error && <p className="text-sm text-slate-600">Enter a six-digit PIN to check delivery and enable payment.</p>}
      {fee !== null && <p>Delivery {formatPrice(fee / 100, currency)}</p>}
      {error ? (
        <Alert tone="error" role="alert">
          {error}
        </Alert>
      ) : null}

      <PrimaryButton type="button" onClick={handlePay} loading={loading} disabled={disabled || fee === null} className="w-full gap-2">
        {!loading ? <Lock className="h-4 w-4" /> : null}
        {loading ? 'Preparing payment…' : `Pay ${formatPrice(total + (fee ?? 0) / 100, currency)}`}
      </PrimaryButton>

      <Text variant="caption" className="text-center text-slate-400">
        You will be redirected to the secure Razorpay checkout to complete your payment.
      </Text>
    </div>
  );
}

