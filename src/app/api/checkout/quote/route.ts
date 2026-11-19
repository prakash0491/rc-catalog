import { deliveryFeePaise } from '@/lib/delivery';

export function GET(request: Request) {
  const pin = new URL(request.url).searchParams.get('pin') ?? '';
  return Response.json({ fee: deliveryFeePaise(pin) }, { headers: { 'Cache-Control': 'no-store' } });
}
