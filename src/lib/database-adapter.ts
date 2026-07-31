import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';

export const isNeonConnectionString = (connectionString: string) => {
  const hostname = new URL(connectionString).hostname.toLowerCase();
  return hostname === 'neon.tech' || hostname.endsWith('.neon.tech');
};

export const createDatabaseAdapter = (connectionString: string) =>
  isNeonConnectionString(connectionString)
    ? new PrismaNeon({ connectionString })
    : new PrismaPg({ connectionString });
