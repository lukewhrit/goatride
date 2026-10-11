/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '@/generated/prisma/client';

/*
 * pg currently treats sslmode=require as verify-full but logs a security warning about weakening
 * it in pg v9. Neon's URLs (managed by the Vercel integration) use `require`, so ask for
 * verify-full explicitly: same behavior today, no warning, and no downgrade later.
 */
const connectionString = process.env.DATABASE_URL!.replace(
  /\bsslmode=(prefer|require|verify-ca)\b/,
  'sslmode=verify-full',
);

const adapter = new PrismaPg({ connectionString });

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
