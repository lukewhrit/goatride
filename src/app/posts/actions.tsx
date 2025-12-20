'use server';

import { RideStatus } from '@/generated/prisma/enums';
import prisma from '@/lib/prisma';

import type { RidePost } from '@/generated/prisma/client';

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

export async function fetchPosts(): Promise<RidePostPriceString[]> {
  const posts = await prisma.ridePost.findMany({
    where: {
      status: RideStatus.OPEN,
    },
    include: {
      creator: true,
    },
  });

  return posts.map((post) => ({
    ...post,
    price: post.price?.toString() ?? '0',
  }));
}

export async function publishPost(user: User, data: PublishPostForm): Promise<RidePost> {
  return prisma.ridePost.create({
    data: {
      creator: {
        connect: {
          id: user.id,
        },
      },

      originLat: 42.2741,
      originLng: 71.808,
      destinationLat: 0,
      destinationLng: 0,

      departureTime: new Date(data.departureDate),
      seatsAvailable: data.seatsAvailable,
      seatsTaken: 0,

      notes: data.comments,
      price: data.seatPrice,

      status: RideStatus.OPEN,
    },
  });
}
