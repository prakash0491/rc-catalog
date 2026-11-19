import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ session: vi.fn(), updateMany: vi.fn() }));
vi.mock('@/lib/auth/server', () => ({ getAdminSessionFromCookieStore: mocks.session }));
vi.mock('@/lib/prisma', () => ({ prisma: { order: { updateMany: mocks.updateMany } } }));
import { POST } from '@/app/admin/api/dispatch/route';

const origin = 'https://preview.example';
function request(source = origin) {
  return new Request(origin + '/admin/api/dispatch', {
    method: 'POST', headers: { origin: source }, body: new URLSearchParams({ id: 'order', booking: ' porter-ref ' }),
  });
}
beforeEach(() => { vi.resetAllMocks(); mocks.session.mockResolvedValue({ id: 'admin' }); });
it('requires admin authentication and same-origin submission', async () => {
  expect((await POST(request('https://elsewhere.example'))).status).toBe(403);
  mocks.session.mockResolvedValue(null);
  expect((await POST(request())).status).toBe(401);
  expect(mocks.updateMany).not.toHaveBeenCalled();
});
it('records one paid dispatch and rejects ineligible or repeated submissions', async () => {
  mocks.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
  expect((await POST(request())).status).toBe(303);
  expect(mocks.updateMany).toHaveBeenCalledWith({
    where: { id: 'order', status: 'PAID', payments: { some: { status: 'PAID' } } },
    data: { porterBooking: 'porter-ref', status: 'SHIPPED' },
  });
  expect((await POST(request())).status).toBe(409);
});
