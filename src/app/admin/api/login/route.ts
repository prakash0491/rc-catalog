import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { ADMIN_LOGIN_PATH, authenticateAdmin, createAdminSessionCookie, getSafeAdminRedirectPath } from '@/lib/auth/server';

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  next: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const parsed = loginSchema.safeParse({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
    next: String(formData.get('next') ?? ''),
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL(`${ADMIN_LOGIN_PATH}?error=invalid`, request.url));
  }

  const adminSession = await authenticateAdmin(parsed.data.email, parsed.data.password);

  if (!adminSession) {
    return NextResponse.redirect(new URL(`${ADMIN_LOGIN_PATH}?error=invalid`, request.url));
  }

  const redirectPath = getSafeAdminRedirectPath(parsed.data.next);
  const response = NextResponse.redirect(new URL(redirectPath, request.url));

  return createAdminSessionCookie(response, adminSession);
}
