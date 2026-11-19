import { afterEach, describe, expect, it, vi } from 'vitest';
import { deliveryFeePaise } from '@/lib/delivery';

afterEach(() => vi.unstubAllEnvs());
describe('delivery fees', () => {
  it('accepts free delivery and integer paise only for configured PINs', () => {
    vi.stubEnv('DELIVERY_FEES_PAISE', '{"560001":0,"560002":2550,"560003":-1,"560004":"0"}');
    expect(deliveryFeePaise('560001')).toBe(0);
    expect(deliveryFeePaise('560002')).toBe(2550);
    for (const pin of ['560003', '560004', '560005', '', 'constructor']) expect(deliveryFeePaise(pin)).toBeNull();
  });
  it('disables delivery on invalid configuration', () => {
    vi.stubEnv('DELIVERY_FEES_PAISE', 'invalid');
    expect(deliveryFeePaise('560001')).toBeNull();
  });
});
