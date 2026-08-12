import 'server-only';

import bcrypt from 'bcrypt';

const BCRYPT_COST = 12;

export function hashCustomerPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function verifyCustomerPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}