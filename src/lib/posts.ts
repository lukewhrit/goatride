'use server';

import { RideStatus } from '@/generated/prisma/enums';
import { geocode } from '@/lib/maps';
import prisma from '@/lib/prisma';

import type { RidePost } from '@/generated/prisma/client';
import type { ContactPlatforms } from '@/generated/prisma/enums';
import type { RidePostWhereInput } from '@/generated/prisma/models';

export interface User {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null | undefined;
}

export interface PublishPostForm {
  origin: string;
  destination: string;
  departureDate: string;
  seatsAvailable: number;
  seatPrice: number;
  contactMethod: string;
  contactMethodType: string;
  comments: string;
}

export interface RidePostPriceString extends Omit<RidePost, 'price'> {
  creator: User;
  price: string;
}

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
  const pageSize = opts.pageSize ?? 12;
  const page = Math.max(1, opts.page);
  const skip = (page - 1) * pageSize;
  const where: RidePostWhereInput = {
    ...(opts.rideStatus !== 'ALL' && { status: opts.rideStatus }),
    ...(opts.ownerId && { creatorId: opts.ownerId }),
  };

  const [posts, total] = await Promise.all([
    prisma.ridePost.findMany({
      where,
      include: { creator: true },
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
  user: User,
  data: PublishPostForm,
): Promise<Omit<RidePostPriceString, 'creator'>> {
  const geocodedOrigin = await geocode(data.origin);
  const geocodedDestination = await geocode(data.destination);

  const post = await prisma.ridePost.create({
    data: {
      creator: {
        connect: {
          id: user.id,
        },
      },

      originLat: geocodedOrigin.lat,
      originLng: geocodedOrigin.lng,
      destinationLat: geocodedDestination.lat,
      destinationLng: geocodedDestination.lng,

      departureTime: new Date(data.departureDate),
      seatsAvailable: data.seatsAvailable,
      seatsTaken: 0,

      contactMethod: '@lwhrit',
      contactPlatform: data.contactMethodType as ContactPlatforms,

      notes: data.comments ?? 'N/A',
      price: data.seatPrice,

      status: RideStatus.OPEN,
    },
  });

  return {
    ...post,
    price: post.price?.toString() ?? '0',
  };
}
