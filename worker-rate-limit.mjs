export async function checkRateLimit(request, env) {
  const path = new URL(request.url).pathname.replace(/\/+$/, '').toLowerCase();
  let binding;
  if (request.method === 'POST' && path === '/admin/api/login') binding = 'ADMIN_RATE_LIMIT';
  else if (path.startsWith('/api/checkout/')) binding = 'CHECKOUT_RATE_LIMIT';
  else return null;

  const headers = { 'Cache-Control': 'no-store', 'Retry-After': '60' };
  try {
    const key = request.headers.get('CF-Connecting-IP') || 'unknown';
    const { success } = await env[binding].limit({ key });
    if (success) return null;
    return Response.json({ success: false, error: { message: 'Too many requests. Try again in a minute.' } }, { status: 429, headers });
  } catch {
    return Response.json({ success: false, error: { message: 'Temporarily unavailable.' } }, { status: 503, headers });
  }
}
