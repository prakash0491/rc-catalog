import { configuredDeliveryFee } from '@/lib/configured-delivery';

export async function GET(request: Request) {
  const pin = new URL(request.url).searchParams.get('pin') ?? '';
  return Response.json({ fee: await configuredDeliveryFee(pin) }, { headers: { 'Cache-Control': 'no-store' } });
}
