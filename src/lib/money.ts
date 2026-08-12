// Store currency. Defaults to INR (Razorpay's native currency) and can be
// overridden with RAZORPAY_CURRENCY (e.g. "USD") for international payments.
// Server-side, the env var is resolved at module load; on the client it falls
// back to INR, so callers that need the configured currency should receive it
// from the server (as the checkout page does).
export const CHECKOUT_CURRENCY = (process.env.RAZORPAY_CURRENCY ?? 'INR').toUpperCase();

export function formatPrice(amount: number, currency: string = CHECKOUT_CURRENCY): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function currencyDecimals(currency: string): number {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

// Razorpay expects amounts in the currency's smallest unit (paise for INR,
// cents for USD). This mirrors the display decimals for the chosen currency.
export function toRazorpayAmount(amount: number, currency = CHECKOUT_CURRENCY): number {
  const decimals = currencyDecimals(currency);
  return Math.round(amount * 10 ** decimals);
}
