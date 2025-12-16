/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '@/generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

/*
 * avoid instantiating PrismaClient globally in long-lived environments. Instead,
 * create and dispose of the client per request to prevent exhausting your
 * database connections.
 */

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
