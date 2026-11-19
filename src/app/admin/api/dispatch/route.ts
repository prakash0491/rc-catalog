import { getAdminSessionFromCookieStore } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  if (!await getAdminSessionFromCookieStore()) return new Response(null, { status: 401 });
  if (request.headers.get('origin') !== new URL(request.url).origin) return new Response(null, { status: 403 });
  const form = await request.formData();
  const id = String(form.get('id') ?? '');
  const porterBooking = String(form.get('booking') ?? '').trim();
  if (!id || !porterBooking || porterBooking.length > 160) return new Response('Invalid booking reference.', { status: 400 });
  const result = await prisma.order.updateMany({
    where: { id, status: 'PAID', payments: { some: { status: 'PAID' } } },
    data: { porterBooking, status: 'SHIPPED' },
  });
  if (!result.count) return new Response('Order is no longer eligible for dispatch.', { status: 409 });
  return Response.redirect(new URL('/admin/orders', request.url), 303);
}
