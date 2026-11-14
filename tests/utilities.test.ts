import { describe, expect, it } from 'vitest';
import { buildApiError, buildApiSuccess, formatZodErrorMessage, parsePaginationParams, parseQueryParam } from '@/lib/api-utils';
import { formatPrice, toRazorpayAmount, computeDiscountPercent } from '@/lib/money';
import { cn } from '@/lib/utils';
import { getSafeCustomerRedirectPath, isSafeWebLink } from '@/lib/safe-url';

describe('API utilities', () => {
  it('wraps success and errors consistently', () => {
    expect(buildApiSuccess({ id: 1 })).toEqual({ success: true, data: { id: 1 } });
    expect(buildApiError('Missing', 'NOT_FOUND')).toEqual({ success: false, error: { message: 'Missing', code: 'NOT_FOUND' } });
  });
  it('uses a safe validation fallback', () => {
    expect(formatZodErrorMessage({ issues: [] })).toBe('Invalid input.');
  });
  it('normalizes blank queries', () => {
    expect(parseQueryParam('   ')).toBeUndefined();
    expect(parseQueryParam(' tea ')).toBe('tea');
  });
  it.each(['0', '-1', '1.5', 'NaN', 'Infinity', '9007199254740992'])('rejects invalid pagination %s', (value) => {
    expect(parsePaginationParams(value, value)).toEqual({ page: 1, limit: 12 });
  });
  it('caps the page size', () => {
    expect(parsePaginationParams('2', '200')).toEqual({ page: 2, limit: 100 });
  });
});
describe('money and styles', () => {
  it.each([[19.99, 'INR', 1999], [19.99, 'USD', 1999], [100, 'JPY', 100], [1.234, 'KWD', 1234]] as const)('converts %s %s to minor units', (amount, currency, expected) => {
    expect(toRazorpayAmount(amount, currency)).toBe(expected);
  });
  it('does not round away the amount displayed to customers', () => {
    expect(formatPrice(19.99, 'INR')).toBe('₹19.99');
  });
  it('merges conflicting Tailwind classes', () => {
    expect(cn('p-2', false && 'hidden', 'p-4')).toBe('p-4');
  });
  it.each([
    [90, 100, 10],
    [19.99, 29.99, 33],
    [100, 100, 0],
    [120, 100, 0],
    [0, 0, 0],
  ])('derives a truthful discount for price %s and MRP %s', (price, mrp, expected) => {
    expect(computeDiscountPercent(price, mrp)).toBe(expected);
  });
  it('ignores missing MRP', () => {
    expect(computeDiscountPercent(90, null)).toBe(0);
    expect(computeDiscountPercent(90, undefined)).toBe(0);
  });
});

describe('safe navigation', () => {
  it.each(['javascript:alert(1)', '//evil.example', '/\\evil.example', 'data:text/html,bad', '/\n/evil.example'])('blocks unsafe URL %s', (url) => {
    expect(isSafeWebLink(url)).toBe(false);
    expect(getSafeCustomerRedirectPath(url)).toBe('/account');
  });
  it('preserves internal destinations including queries', () => {
    expect(getSafeCustomerRedirectPath('/checkout?from=cart')).toBe('/checkout?from=cart');
  });
  it('does not redirect customer login to external web sites', () => {
    expect(getSafeCustomerRedirectPath('https://example.com')).toBe('/account');
  });
});
