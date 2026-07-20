import { buildApiSuccess } from '@/lib/api-utils';
import { getPublicContent } from '@/lib/public-content';

export async function GET() {
  return Response.json(buildApiSuccess(await getPublicContent()));
}
