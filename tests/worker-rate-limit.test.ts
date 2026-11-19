import { describe, expect, it, vi } from 'vitest';
import { checkRateLimit } from '../worker-rate-limit.mjs';

describe('Worker admission checks', () => {
  it.each([['/admin/api/login/', 'ADMIN_RATE_LIMIT'], ['/api/checkout/create-order', 'CHECKOUT_RATE_LIMIT'], ['/api/checkout/verify-payment', 'CHECKOUT_RATE_LIMIT']])('throttles %s at the edge', async (path, binding) => {
    const limit = vi.fn().mockResolvedValue({ success: false });
    const req = new Request('https://example.test' + path, { method: 'POST', headers: { 'CF-Connecting-IP': '192.0.2.1', 'X-Forwarded-For': 'spoof' } });
    expect((await checkRateLimit(req, { [binding]: { limit } }))?.status).toBe(429);
    expect(limit).toHaveBeenCalledWith({ key: '192.0.2.1' });
    expect((await checkRateLimit(req, {}))?.status).toBe(503);
  });
  it('leaves signed webhooks available', async () => {
    expect(await checkRateLimit(new Request('https://example.test/api/webhooks/razorpay', { method: 'POST' }), {})).toBeNull();
  });
});
