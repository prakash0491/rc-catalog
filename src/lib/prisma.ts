import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';
import type { AsyncLocalStorage } from 'node:async_hooks';

type DatabaseScope = { client?: PrismaClient };
const runtime = globalThis as typeof globalThis & {
  rcDatabaseScope?: AsyncLocalStorage<DatabaseScope>;
};
const nodeScope: DatabaseScope = {};

function currentClient() {
  const scope = runtime.rcDatabaseScope?.getStore() ?? nodeScope;
  if (!scope.client) {
    const connectionString = process.env.DATABASE_URL;
    const adapter = connectionString && new URL(connectionString).hostname.endsWith('.neon.tech')
      ? new PrismaNeon({ connectionString })
      : new PrismaPg({ connectionString });
    scope.client = new PrismaClient({ adapter });
  }
  return scope.client;
}

// Keep existing imports usable while confining Worker database sockets to their request.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, key) {
    const client = currentClient();
    const value = Reflect.get(client, key);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
