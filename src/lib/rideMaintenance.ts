import { RideStatus } from '@/generated/prisma/enums';
import prisma from '@/lib/prisma';

/*
 * Not a server action module on purpose: these run from the cron route only, never from the
 * browser.
 */

/*
 * Departures are stored as a date at midnight (no time yet, see #18), so a ride stays listed for
 * the whole of its departure day. Shrink this once posts carry a real departure time.
 */
export const EXPIRY_GRACE_MS = 24 * 60 * 60 * 1000;

/** Marks open/full rides whose departure has passed as completed. Returns how many changed. */
export async function expireRides(now: Date = new Date()): Promise<number> {
  const { count } = await prisma.ridePost.updateMany({
    where: {
      status: { in: [RideStatus.OPEN, RideStatus.FULL] },
      departureTime: { lt: new Date(now.getTime() - EXPIRY_GRACE_MS) },
    },
    data: { status: RideStatus.COMPLETED },
  });

  return count;
}
