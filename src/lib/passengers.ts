'use server';

import { PassengerStatus, RideStatus } from '@/generated/prisma/enums';
import { toResult, UserError } from '@/lib/actionResult';
import prisma from '@/lib/prisma';
import { requireUser, requireVerifiedUser } from '@/lib/session';

import type { Prisma } from '@/generated/prisma/client';
import type { ActionResult } from '@/lib/actionResult';
import type { PublicUser } from '@/lib/posts';

/*
 * Riders join a ride from its conversation: the driver invites the other participant, who accepts
 * or declines. Every action is scoped to a conversation the caller is in, so nobody can be invited
 * to (or pulled from) a ride outside a chat with its driver. Each step also posts a message to the
 * chat so the other person sees it (and gets an unread badge).
 */

type Tx = Prisma.TransactionClient;

/** The ride a conversation is about, its driver, and the other participant (the would-be rider). */
async function loadRideConversation(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      participants: { select: { userId: true } },
      ridePost: { select: { id: true, creatorId: true, status: true } },
    },
  });
  if (!conversation?.participants.some((p) => p.userId === userId)) {
    throw new Error('Not a participant');
  }

  const ride = conversation.ridePost;
  if (!ride) throw new UserError('This conversation is not about a ride');
  const riderId = conversation.participants.find((p) => p.userId !== ride.creatorId)?.userId;
  if (!riderId) throw new UserError('This conversation has no rider');

  return { ride, driverId: ride.creatorId, riderId };
}

/** Posts an update into the chat as `senderId`, like `sendMessage` does. */
async function postUpdate(tx: Tx, conversationId: string, senderId: string, content: string) {
  const now = new Date();
  await tx.message.create({ data: { conversationId, senderId, content } });
  await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: now } });
  await tx.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId: senderId } },
    data: { lastReadAt: now },
  });
}

/*
 * Seat counts change with conditional updates, so two riders accepting at once can't both take
 * the last seat: Postgres re-checks the WHERE clause after locking the row.
 */
async function takeSeat(tx: Tx, ridePostId: string) {
  const { count } = await tx.ridePost.updateMany({
    where: {
      id: ridePostId,
      status: RideStatus.OPEN,
      seatsTaken: { lt: prisma.ridePost.fields.seatsAvailable },
    },
    data: { seatsTaken: { increment: 1 } },
  });
  if (count === 0) throw new UserError('This ride has no seats left');

  await tx.ridePost.updateMany({
    where: {
      id: ridePostId,
      status: RideStatus.OPEN,
      seatsTaken: { gte: prisma.ridePost.fields.seatsAvailable },
    },
    data: { status: RideStatus.FULL },
  });
}

async function releaseSeat(tx: Tx, ridePostId: string) {
  await tx.ridePost.updateMany({
    where: { id: ridePostId, seatsTaken: { gt: 0 } },
    data: { seatsTaken: { decrement: 1 } },
  });
  await tx.ridePost.updateMany({
    where: {
      id: ridePostId,
      status: RideStatus.FULL,
      seatsTaken: { lt: prisma.ridePost.fields.seatsAvailable },
    },
    data: { status: RideStatus.OPEN },
  });
}

/** Driver only: invites the other participant of a ride conversation to the ride. */
export async function invitePassenger(conversationId: string): Promise<ActionResult<void>> {
  return toResult(async () => {
    const user = await requireVerifiedUser();

    const { ride, driverId, riderId } = await loadRideConversation(conversationId, user.id);
    if (user.id !== driverId) throw new UserError('Only the driver can invite riders');
    if (ride.status !== RideStatus.OPEN) throw new UserError('This ride is not open');

    await prisma.$transaction(async (tx) => {
      const key = { ridePostId: ride.id, userId: riderId };
      const existing = await tx.ridePassenger.findUnique({ where: { ridePostId_userId: key } });
      if (existing?.status === PassengerStatus.ACCEPTED)
        throw new UserError('Already on this ride');
      if (existing?.status === PassengerStatus.INVITED) throw new UserError('Already invited');

      await tx.ridePassenger.upsert({
        where: { ridePostId_userId: key },
        create: key,
        update: { status: PassengerStatus.INVITED },
      });
      await postUpdate(tx, conversationId, user.id, 'Invited you to join this ride.');
    });
  });
}

/** Rider only: accepts (taking a seat) or declines a pending invite. */
export async function respondToInvite(
  conversationId: string,
  accept: boolean,
): Promise<ActionResult<void>> {
  return toResult(async () => {
    const user = await requireVerifiedUser();

    const { ride, riderId } = await loadRideConversation(conversationId, user.id);
    if (user.id !== riderId) throw new UserError('Only the invited rider can respond');

    await prisma.$transaction(async (tx) => {
      const { count } = await tx.ridePassenger.updateMany({
        where: { ridePostId: ride.id, userId: user.id, status: PassengerStatus.INVITED },
        data: { status: accept ? PassengerStatus.ACCEPTED : PassengerStatus.DECLINED },
      });
      if (count === 0) throw new UserError('No pending invite');

      if (accept) await takeSeat(tx, ride.id);
      await postUpdate(
        tx,
        conversationId,
        user.id,
        accept ? 'Accepted the invite.' : 'Declined the invite.',
      );
    });
  });
}

/** Rider only: gives up their seat on a ride they joined. */
export async function leaveRide(conversationId: string): Promise<ActionResult<void>> {
  return toResult(async () => {
    const user = await requireVerifiedUser();

    const { ride, riderId } = await loadRideConversation(conversationId, user.id);
    if (user.id !== riderId) throw new UserError('Only riders can leave a ride');
    if (ride.status !== RideStatus.OPEN && ride.status !== RideStatus.FULL) {
      throw new UserError('This ride has already ended');
    }

    await prisma.$transaction(async (tx) => {
      const { count } = await tx.ridePassenger.deleteMany({
        where: { ridePostId: ride.id, userId: user.id, status: PassengerStatus.ACCEPTED },
      });
      if (count === 0) throw new UserError('You are not on this ride');

      await releaseSeat(tx, ride.id);
      await postUpdate(tx, conversationId, user.id, 'Left the ride.');
    });
  });
}

/** Driver only: cancels a pending invite, or removes a rider who already joined. */
export async function removePassenger(conversationId: string): Promise<ActionResult<void>> {
  return toResult(async () => {
    const user = await requireVerifiedUser();

    const { ride, driverId, riderId } = await loadRideConversation(conversationId, user.id);
    if (user.id !== driverId) throw new UserError('Only the driver can remove riders');

    await prisma.$transaction(async (tx) => {
      const existing = await tx.ridePassenger.findUnique({
        where: { ridePostId_userId: { ridePostId: ride.id, userId: riderId } },
      });
      if (!existing || existing.status === PassengerStatus.DECLINED) {
        throw new UserError('Nothing to cancel');
      }

      // Conditional on the status just read, so a concurrent accept can't leak a seat
      const { count } = await tx.ridePassenger.deleteMany({
        where: { ridePostId: ride.id, userId: riderId, status: existing.status },
      });
      if (count === 0) throw new UserError('The invite just changed, please try again');

      const wasRiding = existing.status === PassengerStatus.ACCEPTED;
      if (wasRiding) await releaseSeat(tx, ride.id);
      await postUpdate(
        tx,
        conversationId,
        user.id,
        wasRiding ? 'Removed you from this ride.' : 'Cancelled the invite.',
      );
    });
  });
}

/** Riders who have joined each of the session user's rides, keyed by ride id. */
export async function getMyRidePassengers(): Promise<Record<string, PublicUser[]>> {
  const user = await requireUser();

  const rows = await prisma.ridePassenger.findMany({
    where: { status: PassengerStatus.ACCEPTED, ridePost: { creatorId: user.id } },
    select: { ridePostId: true, user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const byRide: Record<string, PublicUser[]> = {};
  rows.forEach((row) => {
    (byRide[row.ridePostId] ??= []).push(row.user);
  });
  return byRide;
}
