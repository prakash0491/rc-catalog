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
    minimumFractionDigits: 0,
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

/**
 * Discount badges must agree with the prices shown to the customer. A stored
 * percentage can drift from MRP/price when an admin edits one field only.
 */
export function computeDiscountPercent(price: number, mrp: number | null | undefined): number {
  if (!Number.isFinite(price) || !Number.isFinite(mrp ?? NaN) || mrp === null || mrp === undefined) {
    return 0;
  }

  if (mrp <= price || mrp <= 0 || price < 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(((mrp - price) / mrp) * 100)));
}
