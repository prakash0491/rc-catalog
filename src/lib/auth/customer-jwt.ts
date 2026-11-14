import { SignJWT, jwtVerify } from 'jose';

import { CUSTOMER_SESSION_TTL_SECONDS } from './customer-constants';
import type { CustomerSession } from './customer-types';

function getCustomerJwtSecret() {
  const secret = process.env.CUSTOMER_JWT_SECRET ?? process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('CUSTOMER_JWT_SECRET or AUTH_SECRET must be configured in production.');
  }
  return new TextEncoder().encode(secret ?? 'dev-customer-secret-change-me');
}

export async function signCustomerSession(session: CustomerSession) {
  return new SignJWT({ email: session.email, name: session.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(session.id)
    .setAudience('rc-customer')
    .setIssuedAt()
    .setExpirationTime(`${CUSTOMER_SESSION_TTL_SECONDS}s`)
    .sign(getCustomerJwtSecret());
}

export async function verifyCustomerSession(token: string): Promise<CustomerSession | null> {
  try {
    const { payload } = await jwtVerify(token, getCustomerJwtSecret(), { algorithms: ['HS256'], audience: 'rc-customer' });
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
