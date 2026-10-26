'use server';

import { RideStatus } from '@/generated/prisma/enums';
import { toResult, UserError } from '@/lib/actionResult';
import { geocodeAddress, UNKNOWN_PLACE } from '@/lib/geocoding';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { publishPostSchema, updatePostSchema } from '@/lib/validation';

import type { RidePost } from '@/generated/prisma/client';
import type { RidePostWhereInput } from '@/generated/prisma/models';
import type { ActionResult } from '@/lib/actionResult';
import type { PublishPostInput, UpdatePostInput } from '@/lib/validation';

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
}

const publicUserSelect = { id: true, name: true, image: true } as const;

export async function fetchPosts(opts: {
  page: number;
  pageSize?: number;
  rideStatus: RideStatus | 'ALL';
  ownerId?: string;
}): Promise<{
  items: RidePostListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}> {
  await requireUser();

  const pageSize = Math.min(Math.max(1, opts.pageSize ?? 12), 50);
  const page = Math.max(1, Math.floor(opts.page) || 1);
  const skip = (page - 1) * pageSize;
  const where: RidePostWhereInput = {
    ...(opts.rideStatus !== 'ALL' && { status: opts.rideStatus }),
    ...(opts.ownerId && { creatorId: opts.ownerId }),
  };

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
    items: posts.map((post) => ({
      ...post,
      price: post.price?.toString() ?? '0',
      origin: post.originName ?? UNKNOWN_PLACE,
      destination: post.destinationName ?? UNKNOWN_PLACE,
    })),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function publishPost(
  input: PublishPostInput,
): Promise<ActionResult<Omit<RidePostPriceString, 'creator'>>> {
  const user = await requireUser();
  const data = publishPostSchema.parse(input);

  return toResult(async () => {
    const [geocodedOrigin, geocodedDestination] = await Promise.all([
      geocodeAddress(data.origin),
      geocodeAddress(data.destination),
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
  const user = await requireUser();
  const data = updatePostSchema.parse(input);

  return toResult(async () => {
    // Riders who already joined keep their seats
    if (data.seatsAvailable !== undefined) {
      const current = await prisma.ridePost.findUnique({
        where: { id, creatorId: user.id },
        select: { seatsTaken: true },
      });
      if (current && data.seatsAvailable < current.seatsTaken) {
        throw new UserError(
          `${current.seatsTaken} ${current.seatsTaken === 1 ? 'rider has' : 'riders have'} already joined this ride`,
        );
      }
    }

    const [geocodedOrigin, geocodedDestination] = await Promise.all([
      data.origin ? geocodeAddress(data.origin) : Promise.resolve(null),
      data.destination ? geocodeAddress(data.destination) : Promise.resolve(null),
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

export async function deletePost(id: string): Promise<void> {
  const user = await requireUser();

  await prisma.ridePost.delete({
    where: { id, creatorId: user.id },
  });
}
