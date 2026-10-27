'use server';

import { RideStatus } from '@/generated/prisma/enums';
import { toResult, UserError } from '@/lib/actionResult';
import { boundingBox, distanceToSegmentMiles } from '@/lib/distance';
import { UNKNOWN_PLACE } from '@/lib/placeName';
import { resolvePlace } from '@/lib/places';
import prisma from '@/lib/prisma';
import { EXPIRY_GRACE_MS } from '@/lib/rideMaintenance';
import { requireUser, requireVerifiedUser } from '@/lib/session';
import { publishPostSchema, searchNearSchema, updatePostSchema } from '@/lib/validation';

import type { RidePost } from '@/generated/prisma/client';
import type { RidePostWhereInput } from '@/generated/prisma/models';
import type { ActionResult } from '@/lib/actionResult';
import type { PublishPostInput, SearchNearInput, UpdatePostInput } from '@/lib/validation';

/** The subset of a user that is safe to expose to other users. */
export interface PublicUser {
  id: string;
  name: string;
  image: string | null;
}

export interface RidePostPriceString extends Omit<RidePost, 'price'> {
  creator: PublicUser;
  price: string;
}

/** A listed post with display names resolved, ready to render without any geocoding. */
export interface RidePostListItem extends RidePostPriceString {
  origin: string;
  destination: string;
  /** Only set when searching: how close the ride's route passes to the searched place. */
  distanceMiles?: number;
}

const publicUserSelect = { id: true, name: true, image: true } as const;

export interface PostsPage {
  items: RidePostListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function toListItem(
  post: RidePost & { creator: PublicUser },
  distanceMiles?: number,
): RidePostListItem {
  return {
    ...post,
    price: post.price?.toString() ?? '0',
    origin: post.originName ?? UNKNOWN_PLACE,
    destination: post.destinationName ?? UNKNOWN_PLACE,
    ...(distanceMiles !== undefined && { distanceMiles }),
  };
}

/*
 * Distance to a segment can't be expressed in a Prisma filter, so narrow the candidates in SQL to
 * rides whose endpoint box overlaps the search box, then measure, sort, and paginate here. Fine
 * at our scale: only open, upcoming rides near the point ever reach this loop.
 */
async function fetchPostsNear(
  near: { lat: number; lng: number; radiusMiles: number },
  baseWhere: RidePostWhereInput,
  page: number,
  pageSize: number,
): Promise<PostsPage> {
  const box = boundingBox(near, near.radiusMiles);
  // A segment's box overlaps the search box when min(ends) <= max edge and max(ends) >= min edge
  const where: RidePostWhereInput = {
    ...baseWhere,
    AND: [
      { OR: [{ originLat: { lte: box.maxLat } }, { destinationLat: { lte: box.maxLat } }] },
      { OR: [{ originLat: { gte: box.minLat } }, { destinationLat: { gte: box.minLat } }] },
      { OR: [{ originLng: { lte: box.maxLng } }, { destinationLng: { lte: box.maxLng } }] },
      { OR: [{ originLng: { gte: box.minLng } }, { destinationLng: { gte: box.minLng } }] },
    ],
  };

  const candidates = await prisma.ridePost.findMany({
    where,
    select: {
      id: true,
      originLat: true,
      originLng: true,
      destinationLat: true,
      destinationLng: true,
      departureTime: true,
    },
  });

  const matches = candidates
    .map((c) => ({
      id: c.id,
      departureTime: c.departureTime,
      distance: distanceToSegmentMiles(
        near,
        { lat: c.originLat, lng: c.originLng },
        { lat: c.destinationLat, lng: c.destinationLng },
      ),
    }))
    .filter((m) => m.distance <= near.radiusMiles)
    // Closest first; whole miles so a ride leaving sooner wins over one a few yards closer
    .sort(
      (a, b) =>
        Math.round(a.distance) - Math.round(b.distance) ||
        a.departureTime.getTime() - b.departureTime.getTime(),
    );

  const pageMatches = matches.slice((page - 1) * pageSize, page * pageSize);
  const posts = await prisma.ridePost.findMany({
    where: { id: { in: pageMatches.map((m) => m.id) } },
    include: { creator: { select: publicUserSelect } },
  });
  const byId = new Map(posts.map((p) => [p.id, p]));

  return {
    items: pageMatches.flatMap((m) => {
      const post = byId.get(m.id);
      return post ? [toListItem(post, m.distance)] : [];
    }),
    page,
    pageSize,
    total: matches.length,
    totalPages: Math.max(1, Math.ceil(matches.length / pageSize)),
  };
}

export async function fetchPosts(opts: {
  page: number;
  pageSize?: number;
  rideStatus: RideStatus | 'ALL';
  ownerId?: string;
  /** Only rides whose route (origin to destination) passes within the radius of this point. */
  near?: SearchNearInput;
}): Promise<PostsPage> {
  await requireUser();

  const pageSize = Math.min(Math.max(1, opts.pageSize ?? 12), 50);
  const page = Math.max(1, Math.floor(opts.page) || 1);
  const skip = (page - 1) * pageSize;
  const where: RidePostWhereInput = {
    ...(opts.rideStatus !== 'ALL' && { status: opts.rideStatus }),
    ...(opts.ownerId && { creatorId: opts.ownerId }),
    // The expiry cron only runs daily, so hide departed rides it hasn't completed yet
    ...(opts.rideStatus === RideStatus.OPEN && {
      departureTime: { gte: new Date(Date.now() - EXPIRY_GRACE_MS) },
    }),
  };

  if (opts.near) {
    return fetchPostsNear(searchNearSchema.parse(opts.near), where, page, pageSize);
  }

  const [posts, total] = await Promise.all([
    prisma.ridePost.findMany({
      where,
      include: { creator: { select: publicUserSelect } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.ridePost.count({ where }),
  ]);

  return {
    items: posts.map((post) => toListItem(post)),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function publishPost(
  input: PublishPostInput,
): Promise<ActionResult<Omit<RidePostPriceString, 'creator'>>> {
  return toResult(async () => {
    const user = await requireVerifiedUser();
    const data = publishPostSchema.parse(input);

    const [geocodedOrigin, geocodedDestination] = await Promise.all([
      resolvePlace(data.origin),
      resolvePlace(data.destination),
    ]);

    const post = await prisma.ridePost.create({
      data: {
        creator: { connect: { id: user.id } },

        originLat: geocodedOrigin.lat,
        originLng: geocodedOrigin.lng,
        destinationLat: geocodedDestination.lat,
        destinationLng: geocodedDestination.lng,
        originName: geocodedOrigin.name,
        destinationName: geocodedDestination.name,

        departureTime: new Date(data.departureDate),
        seatsAvailable: data.seatsAvailable,
        seatsTaken: 0,

        notes: data.comments || 'N/A',
        price: data.seatPrice,

        status: RideStatus.OPEN,
      },
    });

    return {
      ...post,
      price: post.price?.toString() ?? '0',
    };
  });
}

export async function updatePost(id: string, input: UpdatePostInput): Promise<ActionResult<void>> {
  return toResult(async () => {
    const user = await requireVerifiedUser();
    const data = updatePostSchema.parse(input);

    if (data.seatsAvailable !== undefined || data.status === RideStatus.OPEN) {
      const current = await prisma.ridePost.findUnique({
        where: { id, creatorId: user.id },
        select: { seatsTaken: true, seatsAvailable: true, departureTime: true },
      });

      // Riders who already joined keep their seats
      if (
        current &&
        data.seatsAvailable !== undefined &&
        data.seatsAvailable < current.seatsTaken
      ) {
        throw new UserError(
          `${current.seatsTaken} ${current.seatsTaken === 1 ? 'rider has' : 'riders have'} already joined this ride`,
        );
      }

      // Reopening only makes sense for a ride that still has room and hasn't left
      if (current && data.status === RideStatus.OPEN) {
        if (current.seatsTaken >= (data.seatsAvailable ?? current.seatsAvailable)) {
          throw new UserError('Every seat is taken; add seats before reopening this ride');
        }
        const departure = data.departureDate ? new Date(data.departureDate) : current.departureTime;
        if (departure.getTime() < Date.now() - EXPIRY_GRACE_MS) {
          throw new UserError('This ride has already departed');
        }
      }
    }

    const [geocodedOrigin, geocodedDestination] = await Promise.all([
      data.origin ? resolvePlace(data.origin) : Promise.resolve(null),
      data.destination ? resolvePlace(data.destination) : Promise.resolve(null),
    ]);

    await prisma.ridePost.update({
      where: { id, creatorId: user.id },
      data: {
        ...(geocodedOrigin && {
          originLat: geocodedOrigin.lat,
          originLng: geocodedOrigin.lng,
          originName: geocodedOrigin.name,
        }),
        ...(geocodedDestination && {
          destinationLat: geocodedDestination.lat,
          destinationLng: geocodedDestination.lng,
          destinationName: geocodedDestination.name,
        }),
        ...(data.departureDate && { departureTime: new Date(data.departureDate) }),
        ...(data.seatsAvailable !== undefined && { seatsAvailable: data.seatsAvailable }),
        ...(data.seatPrice !== undefined && { price: data.seatPrice }),
        ...(data.comments !== undefined && { notes: data.comments || 'N/A' }),
        ...(data.status && { status: data.status }),
        lastEditedAt: new Date(),
      },
    });

    // Keep OPEN/FULL in step with the new seat count (an explicit status change wins)
    if (data.seatsAvailable !== undefined && !data.status) {
      const { seatsTaken } = prisma.ridePost.fields;
      await prisma.ridePost.updateMany({
        where: {
          id,
          creatorId: user.id,
          status: RideStatus.OPEN,
          seatsAvailable: { lte: seatsTaken },
        },
        data: { status: RideStatus.FULL },
      });
      await prisma.ridePost.updateMany({
        where: {
          id,
          creatorId: user.id,
          status: RideStatus.FULL,
          seatsAvailable: { gt: seatsTaken },
        },
        data: { status: RideStatus.OPEN },
      });
    }
  });
}

export async function deletePost(id: string): Promise<ActionResult<void>> {
  return toResult(async () => {
    const user = await requireVerifiedUser();

    await prisma.ridePost.delete({
      where: { id, creatorId: user.id },
    });
  });
}
