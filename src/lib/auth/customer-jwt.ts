import { SignJWT, jwtVerify } from 'jose';

import { CUSTOMER_SESSION_TTL_SECONDS } from './customer-constants';
import type { CustomerSession } from './customer-types';

function getCustomerJwtSecret() {
  const secret = process.env.CUSTOMER_JWT_SECRET ?? process.env.AUTH_SECRET ?? 'dev-customer-secret-change-me';
  return new TextEncoder().encode(secret);
}

export async function signCustomerSession(session: CustomerSession) {
  return new SignJWT({ email: session.email, name: session.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(session.id)
    .setIssuedAt()
    .setExpirationTime(`${CUSTOMER_SESSION_TTL_SECONDS}s`)
    .sign(getCustomerJwtSecret());
}

export async function verifyCustomerSession(token: string): Promise<CustomerSession | null> {
  try {
    const { payload } = await jwtVerify(token, getCustomerJwtSecret());
    const id = payload.sub;
    const email = payload.email;
    const name = payload.name;

    if (typeof id !== 'string' || typeof email !== 'string') {
      return null;
    }

    return {
      id,
      email,
      name: typeof name === 'string' ? name : '',
    };
  } catch {
    return null;
  }
}