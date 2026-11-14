import { SignJWT, jwtVerify } from 'jose';

import { ADMIN_SESSION_TTL_SECONDS } from './constants';
import type { AdminSession } from './types';

function getAdminJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('ADMIN_JWT_SECRET or AUTH_SECRET must be configured in production.');
  }
  return new TextEncoder().encode(secret ?? 'dev-admin-secret-change-me');
}

export async function signAdminSession(session: AdminSession) {
  return new SignJWT({ email: session.email, name: session.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(session.id)
    .setAudience('rc-admin')
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_TTL_SECONDS}s`)
    .sign(getAdminJwtSecret());
}

export async function verifyAdminSession(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getAdminJwtSecret(), { algorithms: ['HS256'], audience: 'rc-admin' });
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
