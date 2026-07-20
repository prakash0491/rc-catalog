import { SignJWT, jwtVerify } from 'jose';

import { ADMIN_SESSION_TTL_SECONDS } from './constants';
import type { AdminSession } from './types';

function getAdminJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'dev-admin-secret-change-me';
  return new TextEncoder().encode(secret);
}

export async function signAdminSession(session: AdminSession) {
  return new SignJWT({ email: session.email, name: session.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(session.id)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_TTL_SECONDS}s`)
    .sign(getAdminJwtSecret());
}

export async function verifyAdminSession(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getAdminJwtSecret());
    const id = payload.sub;
    const email = payload.email;

    if (typeof id !== 'string' || typeof email !== 'string') {
      return null;
    }

    return {
      id,
      email,
      name: typeof payload.name === 'string' ? payload.name : null,
    };
  } catch {
    return null;
  }
}
