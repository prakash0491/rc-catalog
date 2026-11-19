import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getAdminSessionFromCookieStore } from '@/lib/auth/server';

async function book(form: FormData) {
  'use server';
  if (!await getAdminSessionFromCookieStore()) throw new Error('Unauthorized');
  const booking = String(form.get('booking') ?? '').trim();
  if (!booking || booking.length > 160) throw new Error('Enter a Porter booking reference.');
  await prisma.order.updateMany({ where: { id: String(form.get('id')), status: 'PAID', payments: { some: { status: 'PAID' } } }, data: { porterBooking: booking, status: 'SHIPPED' } });
  revalidatePath('/admin/orders');
}
export default async function Orders() {
  const orders = await prisma.order.findMany({ take: 100, orderBy: { createdAt: 'desc' }, include: { items: true, payments: true } });
  return <section><h2 className="text-2xl font-bold">Recent orders</h2>{orders.map(o => <article key={o.id} className="my-4 rounded border p-4"><h3>{o.orderNumber} · {o.status}</h3><p>{o.recipientName} {o.mobile}</p><p>{o.address} {o.pinCode}</p><ul>{o.items.map(i => <li key={i.id}>{i.quantity} × {i.productName} {i.variantOptionValue} · ₹{String(i.lineTotal)}</li>)}</ul><p>Total ₹{String(o.total)} · Delivery ₹{String(o.deliveryFee)}</p>{o.payments.map(p => <p key={p.id}>{p.status} {p.providerPaymentId}</p>)}{o.porterBooking && <p>Porter reference {o.porterBooking}</p>}{o.status === 'PAID' && <form action={book}><input type="hidden" name="id" value={o.id}/><label>Porter reference <input className="text-black" required name="booking" maxLength={160}/></label><button>Record dispatch</button></form>}</article>)}</section>;
}
