import 'server-only';
import { prisma } from '@/lib/prisma';
import { deliveryFeePaise } from './delivery';

export async function configuredDeliveryFee(pin: string) {
  const settings = await prisma.businessSettings.findFirst({ orderBy: { createdAt: 'asc' }, select: { deliveryRates: true } });
  if (settings?.deliveryRates == null) return deliveryFeePaise(pin);
  const row = settings.deliveryRates.split(/\r?\n/).map(line => line.trim().split(/\s+/)).find(([code]) => code === pin);
  return row && row.length === 2 ? Math.round(Number(row[1]) * 100) : null;
}
