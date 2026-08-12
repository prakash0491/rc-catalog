import 'server-only';

import { prisma } from '@/lib/prisma';

import { hashCustomerPassword, verifyCustomerPassword } from './customer-password';
import type { CustomerSession } from './customer-types';

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function findCustomerByEmail(email: string) {
  return prisma.customer.findUnique({
    where: { email: normalizeEmail(email) },
  });
}

export async function findCustomerById(id: string) {
  return prisma.customer.findUnique({
    where: { id },
  });
}

export async function createCustomer(name: string, email: string, password: string) {
  const passwordHash = await hashCustomerPassword(password);
  return prisma.customer.create({
    data: {
      name,
      email: normalizeEmail(email),
      passwordHash,
    },
  });
}

export async function authenticateCustomer(email: string, password: string): Promise<CustomerSession | null> {
  const customer = await findCustomerByEmail(email);

  if (!customer) {
    return null;
  }

  const isValid = await verifyCustomerPassword(password, customer.passwordHash);

  if (!isValid) {
    return null;
  }

  return {
    id: customer.id,
    email: customer.email,
    name: customer.name,
  };
}