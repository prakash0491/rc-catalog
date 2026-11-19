import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const cloud = vi.hoisted(() => ({ config: vi.fn(), uploader: { upload: vi.fn() }, api: { resource: vi.fn() } }));
vi.mock('cloudinary', () => ({ v2: cloud }));
import { uploadBannerImage, uploadCategoryImage, uploadProductImage } from '@/lib/cloudinary';
import { verifyRazorpayPaymentSignature, verifyRazorpayWebhookSignature } from '@/lib/razorpay';
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('CLOUDINARY_CLOUD_NAME', 'test');
  vi.stubEnv('CLOUDINARY_API_KEY', 'test');
  vi.stubEnv('CLOUDINARY_API_SECRET', 'test');
  vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_test_example');
  vi.stubEnv('RAZORPAY_KEY_SECRET', 'payment-secret');
  vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', 'webhook-secret');
});
afterEach(() => vi.unstubAllEnvs());
describe('Razorpay signatures', () => {
  it('accepts a correct payment HMAC', () => {
    const signature = createHmac('sha256', 'payment-secret').update('order|payment').digest('hex');
    expect(verifyRazorpayPaymentSignature({ razorpayOrderId: 'order', razorpayPaymentId: 'payment', razorpaySignature: signature })).toBe(true);
  });
  it.each(['', 'incorrect', 'a'.repeat(64)])('rejects invalid signatures', (signature) => {
    expect(verifyRazorpayPaymentSignature({ razorpayOrderId: 'order', razorpayPaymentId: 'payment', razorpaySignature: signature })).toBe(false);
  });
  it('checks the raw webhook body', () => {
    const body = '{"event":"payment.captured"}';
    const signature = createHmac('sha256', 'webhook-secret').update(body).digest('hex');
    expect(verifyRazorpayWebhookSignature(body, signature)).toBe(true);
    expect(verifyRazorpayWebhookSignature(`${body} `, signature)).toBe(false);
    expect(verifyRazorpayWebhookSignature(body, null)).toBe(false);
  });
  it('fails closed without a webhook secret', () => {
    vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', '');
    expect(() => verifyRazorpayWebhookSignature('{}', 'signature')).toThrow('not configured');
  });
});
describe('Cloudinary uploads', () => {
  it.each([uploadBannerImage, uploadCategoryImage, uploadProductImage])('rejects non-images before uploading', async (upload) => {
    await expect(upload(new File(['bad'], 'bad.txt', { type: 'text/plain' }))).rejects.toThrow('Only JPEG');
    expect(cloud.uploader.upload).not.toHaveBeenCalled();
  });
  it('rejects oversized files', async () => {
    await expect(uploadProductImage(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }))).rejects.toThrow('5 MB');
  });
  it('uploads into the intended folder', async () => {
    cloud.uploader.upload.mockResolvedValue({ secure_url: 'https://res.cloudinary.com/test/a.png', public_id: 'image', width: 10, height: 20 });
    expect(await uploadProductImage(new File(['png'], 'small.png', { type: 'image/png' }))).toMatchObject({ publicId: 'image', width: 10 });
    expect(cloud.uploader.upload).toHaveBeenCalledWith(expect.stringContaining('data:image/png;base64,'), expect.objectContaining({ folder: 'rc-catalog/products', overwrite: false }));
  });
  it('resolves deterministic duplicate imports', async () => {
    cloud.uploader.upload.mockRejectedValue(new Error('already exists'));
    cloud.api.resource.mockResolvedValue({ secure_url: 'https://res.cloudinary.com/test/a.png', public_id: 'existing' });
    expect((await uploadProductImage(new File(['png'], 'a.png', { type: 'image/png' }), 'asset')).publicId).toBe('existing');
  });
});
