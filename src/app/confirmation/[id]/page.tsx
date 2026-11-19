import { notFound } from 'next/navigation';
import { getGuestSessionId } from '@/lib/guest-session';
import { prisma } from '@/lib/prisma';

export default async function Confirmation({ params }: { params: Promise<{ id: string }> }) {
  const guestSessionId = await getGuestSessionId();
  if (!guestSessionId) notFound();
  const order = await prisma.order.findFirst({ where: { id: (await params).id, guestSessionId }, select: { status: true, orderNumber: true } });
  if (!order) notFound();
  return <main className="mx-auto max-w-xl p-8"><h1 className="text-2xl font-bold">{['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) ? 'Order confirmed' : 'Order status'}</h1><p>{order.orderNumber} · {order.status}</p></main>;
}
