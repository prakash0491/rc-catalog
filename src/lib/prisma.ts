import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const adapter = connectionString && new URL(connectionString).hostname.endsWith('.neon.tech')
  ? new PrismaNeon({ connectionString })
  : new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });
