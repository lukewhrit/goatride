'use server';

import { toResult, UserError } from './actionResult';
import { UNKNOWN_PLACE } from './placeName';
import prisma from './prisma';
import { requireUser, requireVerifiedUser } from './session';

import type { PassengerStatus } from '@/generated/prisma/enums';

import type { ActionResult } from './actionResult';

export interface ConversationUser {
  id: string;
  name: string;
  image: string | null;
}

/** The ride a conversation was started from, shown at the top of the thread. */
export interface ConversationRide {
  id: string;
  creatorId: string;
  origin: string;
  destination: string;
  departureTime: Date;
  seatsAvailable: number;
  seatsTaken: number;
  price: string;
  status: string;
  /** Where the non-driver participant stands with this ride; null if never invited. */
  passengerStatus: PassengerStatus | null;
}

export interface ConversationPreview {
  id: string;
  otherUser: ConversationUser;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  isUnread: boolean;
  ridePostId: string | null;
  ride: ConversationRide | null;
}

export interface MessageData {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date;
}

export async function getConversations(): Promise<ConversationPreview[]> {
  const user = await requireUser();

  const participants = await prisma.conversationParticipant.findMany({
    where: { userId: user.id },
    include: {
      conversation: {
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          participants: {
            where: { userId: { not: user.id } },
            include: { user: { select: { id: true, name: true, image: true } } },
            take: 1,
          },
          ridePost: {
            select: {
              id: true,
              creatorId: true,
              originName: true,
              destinationName: true,
              departureTime: true,
              seatsAvailable: true,
              seatsTaken: true,
              price: true,
              status: true,
              passengers: { select: { userId: true, status: true } },
            },
          },
        },
      },
    },
    orderBy: { conversation: { updatedAt: 'desc' } },
  });

  type ParticipantRow = (typeof participants)[number];

  return participants.map((p: ParticipantRow) => {
    const lastMsg = p.conversation.messages[0] ?? null;
    const other = p.conversation.participants[0]?.user;
    const ride = p.conversation.ridePost;
    const riderId = ride?.creatorId === user.id ? other?.id : user.id;
    const isUnread =
      !!lastMsg &&
      lastMsg.senderId !== user.id &&
      (!p.lastReadAt || lastMsg.createdAt > p.lastReadAt);

    return {
      id: p.conversationId,
      otherUser: other ?? { id: '', name: 'Unknown', image: null },
      lastMessage: lastMsg?.content ?? null,
      lastMessageAt: lastMsg?.createdAt ?? null,
      isUnread,
      ridePostId: p.conversation.ridePostId,
      ride: ride
        ? {
            id: ride.id,
            creatorId: ride.creatorId,
            origin: ride.originName ?? UNKNOWN_PLACE,
            destination: ride.destinationName ?? UNKNOWN_PLACE,
            departureTime: ride.departureTime,
            seatsAvailable: ride.seatsAvailable,
            seatsTaken: ride.seatsTaken,
            price: ride.price?.toString() ?? '0',
            status: ride.status,
            passengerStatus: ride.passengers.find((r) => r.userId === riderId)?.status ?? null,
          }
        : null,
    };
  });
}

/** Number of messages from other people sent after the user last read each conversation. */
export async function getUnreadMessageCount(): Promise<number> {
  const user = await requireUser();

  const participants = await prisma.conversationParticipant.findMany({
    where: { userId: user.id },
    select: { conversationId: true, lastReadAt: true },
  });
  if (participants.length === 0) return 0;

  return prisma.message.count({
    where: {
      senderId: { not: user.id },
      OR: participants.map((p) => ({
        conversationId: p.conversationId,
        ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
      })),
    },
  });
}

export async function getMessages(conversationId: string): Promise<MessageData[]> {
  const user = await requireUser();

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: user.id } },
  });
  if (!participant) throw new Error('Not a participant');

  const [messages] = await prisma.$transaction([
    prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, senderId: true, content: true, createdAt: true },
    }),
    prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId: user.id } },
      data: { lastReadAt: new Date() },
    }),
  ]);

  return messages;
}

export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<ActionResult<MessageData>> {
  return toResult(async () => {
    const user = await requireVerifiedUser();

    const trimmed = content.trim();
    if (!trimmed) throw new UserError('Message cannot be empty');
    if (trimmed.length > 2000) throw new UserError('Message is too long (2,000 characters max)');

    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.id } },
    });
    if (!participant) throw new Error('Not a participant');

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: { conversationId, senderId: user.id, content: trimmed },
        select: { id: true, senderId: true, content: true, createdAt: true },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
      prisma.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId: user.id } },
        data: { lastReadAt: new Date() },
      }),
    ]);

    return message;
  });
}

export async function getOrCreateConversation(
  otherUserId: string,
  ridePostId?: string,
): Promise<ActionResult<string>> {
  return toResult(async () => {
    const user = await requireVerifiedUser();

    if (user.id === otherUserId) throw new UserError('You cannot message yourself');

    const other = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true },
    });
    if (!other) throw new UserError('That user no longer exists');
    if (ridePostId) {
      const post = await prisma.ridePost.findUnique({
        where: { id: ridePostId },
        select: { creatorId: true },
      });
      if (!post || (post.creatorId !== otherUserId && post.creatorId !== user.id)) {
        throw new UserError('That ride no longer exists');
      }
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        ridePostId: ridePostId ?? null,
        AND: [
          { participants: { some: { userId: user.id } } },
          { participants: { some: { userId: otherUserId } } },
          { participants: { every: { userId: { in: [user.id, otherUserId] } } } },
        ],
      },
      select: { id: true },
    });

    if (existing) return existing.id;

    const created = await prisma.conversation.create({
      data: {
        ridePostId: ridePostId ?? null,
        participants: {
          create: [{ userId: user.id }, { userId: otherUserId }],
        },
      },
      select: { id: true },
    });

    return created.id;
  });
}
