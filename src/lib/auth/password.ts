import bcrypt from 'bcrypt';

const BCRYPT_COST = 12;

export function hashAdminPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function verifyAdminPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}
