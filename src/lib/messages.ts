'use server';

import prisma from './prisma';
import { requireUser } from './session';

export interface ConversationUser {
  id: string;
  name: string;
  image: string | null;
}

export interface ConversationPreview {
  id: string;
  otherUser: ConversationUser;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  isUnread: boolean;
  ridePostId: string | null;
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
        },
      },
    },
    orderBy: { conversation: { updatedAt: 'desc' } },
  });

  type ParticipantRow = (typeof participants)[number];

  return participants.map((p: ParticipantRow) => {
    const lastMsg = p.conversation.messages[0] ?? null;
    const other = p.conversation.participants[0]?.user;
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
    };
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

export async function sendMessage(conversationId: string, content: string): Promise<MessageData> {
  const user = await requireUser();
  const trimmed = content.trim();
  if (!trimmed) throw new Error('Message cannot be empty');
  if (trimmed.length > 2000) throw new Error('Message too long');

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
}

export async function getOrCreateConversation(
  otherUserId: string,
  ridePostId?: string,
): Promise<string> {
  const user = await requireUser();
  if (user.id === otherUserId) throw new Error('Cannot message yourself');

  const other = await prisma.user.findUnique({ where: { id: otherUserId }, select: { id: true } });
  if (!other) throw new Error('User not found');
  if (ridePostId) {
    const post = await prisma.ridePost.findUnique({
      where: { id: ridePostId },
      select: { creatorId: true },
    });
    if (!post || (post.creatorId !== otherUserId && post.creatorId !== user.id)) {
      throw new Error('Ride not found');
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
}
