import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma, requireUser } = vi.hoisted(() => ({
  prisma: {
    $transaction: vi.fn(),
    conversation: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    conversationParticipant: { findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    message: { create: vi.fn(), findMany: vi.fn() },
    ridePost: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
  },
  requireUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ default: prisma }));
// Actions that change data use requireVerifiedUser; by default it returns the same user
vi.mock('@/lib/session', () => ({
  requireUser,
  requireVerifiedUser: vi.fn(async (): Promise<unknown> => requireUser()),
}));

// eslint-disable-next-line import-x/first
import { unwrap, UserError } from '@/lib/actionResult';
// eslint-disable-next-line import-x/first
import { getMessages, getOrCreateConversation, sendMessage } from '@/lib/messages';
// eslint-disable-next-line import-x/first
import { requireVerifiedUser } from '@/lib/session';

const me = { id: 'user-me', name: 'Me', email: 'me@wpi.edu' };

beforeEach(() => {
  requireUser.mockResolvedValue(me);
});

const unverified = () =>
  vi.mocked(requireVerifiedUser).mockRejectedValueOnce(new UserError('Verify your email address'));

describe('message actions require a verified email', () => {
  it.each([
    ['sendMessage', async () => unwrap(sendMessage('c1', 'hi'))],
    ['getOrCreateConversation', async () => unwrap(getOrCreateConversation('other'))],
  ])('%s refuses unverified users', async (_name, call) => {
    unverified();
    await expect(call()).rejects.toThrow('Verify your email');
    expect(prisma.conversationParticipant.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });
});

describe('sendMessage', () => {
  it('rejects empty and overlong messages', async () => {
    await expect(unwrap(sendMessage('c1', '   '))).rejects.toThrow('empty');
    await expect(unwrap(sendMessage('c1', 'x'.repeat(2001)))).rejects.toThrow('too long');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects users who are not in the conversation', async () => {
    prisma.conversationParticipant.findUnique.mockResolvedValue(null);
    await expect(unwrap(sendMessage('c1', 'hi'))).rejects.toThrow('Not a participant');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('getMessages', () => {
  it('rejects users who are not in the conversation', async () => {
    prisma.conversationParticipant.findUnique.mockResolvedValue(null);
    await expect(getMessages('c1')).rejects.toThrow('Not a participant');
  });
});

describe('getOrCreateConversation', () => {
  it('refuses to message yourself', async () => {
    await expect(unwrap(getOrCreateConversation(me.id))).rejects.toThrow('yourself');
  });

  it('refuses unknown users', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(unwrap(getOrCreateConversation('ghost'))).rejects.toThrow('no longer exists');
  });

  it('refuses to attach a ride that neither participant owns', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'other' });
    prisma.ridePost.findUnique.mockResolvedValue({ creatorId: 'someone-else' });
    await expect(unwrap(getOrCreateConversation('other', 'ride-1'))).rejects.toThrow(
      'ride no longer exists',
    );
    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it('reuses an existing conversation', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'other' });
    prisma.ridePost.findUnique.mockResolvedValue({ creatorId: 'other' });
    prisma.conversation.findFirst.mockResolvedValue({ id: 'existing' });

    await expect(unwrap(getOrCreateConversation('other', 'ride-1'))).resolves.toBe('existing');
    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it('creates a conversation with both participants', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'other' });
    prisma.conversation.findFirst.mockResolvedValue(null);
    prisma.conversation.create.mockResolvedValue({ id: 'new' });

    await expect(unwrap(getOrCreateConversation('other'))).resolves.toBe('new');
    expect(prisma.conversation.create.mock.calls[0][0].data.participants).toEqual({
      create: [{ userId: me.id }, { userId: 'other' }],
    });
  });
});
