import { prisma } from '@/lib/prisma';

export default async function Orders() {
  const orders = await prisma.order.findMany({ take: 100, orderBy: { createdAt: 'desc' }, include: { items: true, payments: true } });
  return <section><h2 className="text-2xl font-bold">Recent orders</h2>{orders.map(o => <article key={o.id} className="my-4 rounded border p-4"><h3>{o.orderNumber} · {o.status}</h3><p>{o.recipientName} {o.mobile}</p><p>{o.address} {o.pinCode}</p><ul>{o.items.map(i => <li key={i.id}>{i.quantity} × {i.productName} {i.variantOptionValue} · ₹{String(i.lineTotal)}</li>)}</ul><p>Total ₹{String(o.total)} · Delivery ₹{String(o.deliveryFee)}</p>{o.payments.map(p => <p key={p.id}>{p.status} {p.providerPaymentId}</p>)}{o.porterBooking && <p>Porter reference {o.porterBooking}</p>}{o.status === 'PAID' && <form action="/admin/api/dispatch" method="post"><input type="hidden" name="id" value={o.id}/><label>Porter reference <input className="text-black" required name="booking" maxLength={160}/></label><button>Record dispatch</button></form>}</article>)}</section>;
}
