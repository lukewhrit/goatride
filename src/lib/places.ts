import { geocodeAddress } from '@/lib/geocoding';
import prisma from '@/lib/prisma';

import type { GeocodedPlace } from '@/lib/geocoding';

/*
 * Server-only, like `@/lib/geocoding`: callers must have authenticated already.
 *
 * Most rides start or end at the same handful of towns, and every post already stores the
 * coordinates Google gave for its "Town, ST" name. Reusing those skips the Geocoding call
 * whenever someone types a name we've seen before.
 */
// eslint-disable-next-line import-x/prefer-default-export
export async function resolvePlace(address: string): Promise<GeocodedPlace> {
  const name = address.trim();
  const known = await prisma.ridePost.findFirst({
    where: {
      OR: [
        { originName: { equals: name, mode: 'insensitive' } },
        { destinationName: { equals: name, mode: 'insensitive' } },
      ],
    },
    select: {
      originName: true,
      originLat: true,
      originLng: true,
      destinationName: true,
      destinationLat: true,
      destinationLng: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (known?.originName?.toLowerCase() === name.toLowerCase()) {
    return { lat: known.originLat, lng: known.originLng, name: known.originName };
  }
  if (known?.destinationName?.toLowerCase() === name.toLowerCase()) {
    return { lat: known.destinationLat, lng: known.destinationLng, name: known.destinationName };
  }

  return geocodeAddress(name);
}
