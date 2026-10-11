/*
 * One-off: fill in originName / destinationName for posts created before those columns existed.
 * Safe to re-run; it only touches posts with a missing name.
 *
 *   pnpm db:backfill-place-names
 */
import 'dotenv/config';

import { reverseGeocode } from '@/lib/geocoding';
import prisma from '@/lib/prisma';

const cache = new Map<string, Promise<string>>();

// Many posts share endpoints (campus, nearby cities), so look each coordinate up only once.
const nameFor = async (lat: number, lng: number): Promise<string> => {
  const key = `${lat},${lng}`;
  if (!cache.has(key)) cache.set(key, reverseGeocode(lat, lng));
  return cache.get(key)!;
};

const main = async () => {
  const posts = await prisma.ridePost.findMany({
    where: { OR: [{ originName: null }, { destinationName: null }] },
    select: {
      id: true,
      originLat: true,
      originLng: true,
      originName: true,
      destinationLat: true,
      destinationLng: true,
      destinationName: true,
    },
  });

  console.log(`Backfilling ${posts.length} post(s)…`);

  let failed = 0;
  for (const post of posts) {
    try {
      const [originName, destinationName] = await Promise.all([
        post.originName ?? nameFor(post.originLat, post.originLng),
        post.destinationName ?? nameFor(post.destinationLat, post.destinationLng),
      ]);

      await prisma.ridePost.update({
        where: { id: post.id },
        data: { originName, destinationName },
      });
    } catch (e) {
      failed += 1;
      console.error(`  ${post.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log(
    `Done: ${posts.length - failed} updated, ${failed} failed, ${cache.size} geocoding call(s).`,
  );
  if (failed) process.exitCode = 1;
};

main().finally(async () => prisma.$disconnect());
