import 'server-only';

import { prisma } from '@/lib/prisma';

import { verifyAdminPassword } from './password';
import type { AdminSession } from './types';

export function normalizeAdminEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function findAdminByEmail(email: string) {
  return prisma.admin.findUnique({
    where: {
      email: normalizeAdminEmail(email),
    },
  });
}

export async function authenticateAdmin(email: string, password: string): Promise<AdminSession | null> {
  const admin = await findAdminByEmail(email);

  if (!admin) {
    return null;
  }

  const isValidPassword = await verifyAdminPassword(password, admin.passwordHash);

  if (!isValidPassword) {
    return null;
  }

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
  };
}
