'use server';

import { RideStatus } from '@/generated/prisma/enums';
import { geocode } from '@/lib/maps';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { publishPostSchema, updatePostSchema } from '@/lib/validation';

import type { RidePost } from '@/generated/prisma/client';
import type { RidePostWhereInput } from '@/generated/prisma/models';
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

const publicUserSelect = { id: true, name: true, image: true } as const;

export async function fetchPosts(opts: {
  page: number;
  pageSize?: number;
  rideStatus: RideStatus | 'ALL';
  ownerId?: string;
}): Promise<{
  items: RidePostPriceString[];
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
    })),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function publishPost(
  input: PublishPostInput,
): Promise<Omit<RidePostPriceString, 'creator'>> {
  const user = await requireUser();
  const data = publishPostSchema.parse(input);

  const [geocodedOrigin, geocodedDestination] = await Promise.all([
    geocode(data.origin),
    geocode(data.destination),
  ]);

  const post = await prisma.ridePost.create({
    data: {
      creator: { connect: { id: user.id } },

      originLat: geocodedOrigin.lat,
      originLng: geocodedOrigin.lng,
      destinationLat: geocodedDestination.lat,
      destinationLng: geocodedDestination.lng,

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
}

export async function updatePost(id: string, input: UpdatePostInput): Promise<void> {
  const user = await requireUser();
  const data = updatePostSchema.parse(input);

  const [geocodedOrigin, geocodedDestination] = await Promise.all([
    data.origin ? geocode(data.origin) : Promise.resolve(null),
    data.destination ? geocode(data.destination) : Promise.resolve(null),
  ]);

  await prisma.ridePost.update({
    where: { id, creatorId: user.id },
    data: {
      ...(geocodedOrigin && { originLat: geocodedOrigin.lat, originLng: geocodedOrigin.lng }),
      ...(geocodedDestination && {
        destinationLat: geocodedDestination.lat,
        destinationLng: geocodedDestination.lng,
      }),
      ...(data.departureDate && { departureTime: new Date(data.departureDate) }),
      ...(data.seatsAvailable !== undefined && { seatsAvailable: data.seatsAvailable }),
      ...(data.seatPrice !== undefined && { price: data.seatPrice }),
      ...(data.comments !== undefined && { notes: data.comments || 'N/A' }),
      ...(data.status && { status: data.status }),
      lastEditedAt: new Date(),
    },
  });
}

export async function deletePost(id: string): Promise<void> {
  const user = await requireUser();

  await prisma.ridePost.delete({
    where: { id, creatorId: user.id },
  });
}
