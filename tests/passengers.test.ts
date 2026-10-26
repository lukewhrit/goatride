import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma, requireUser } = vi.hoisted(() => {
  const client = {
    $transaction: vi.fn(),
    conversation: { findUnique: vi.fn(), update: vi.fn() },
    conversationParticipant: { update: vi.fn() },
    message: { create: vi.fn() },
    ridePassenger: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    ridePost: {
      updateMany: vi.fn(),
      fields: { seatsAvailable: 'ref:seatsAvailable' },
    },
  };
  // Interactive transactions run against the same mock client
  client.$transaction.mockImplementation(async (fn: (tx: typeof client) => unknown) => fn(client));
  return { prisma: client, requireUser: vi.fn() };
});

vi.mock('@/lib/prisma', () => ({ default: prisma }));
// Actions that change data use requireVerifiedUser; by default it returns the same user
vi.mock('@/lib/session', () => ({
  requireUser,
  requireVerifiedUser: vi.fn(async (): Promise<unknown> => requireUser()),
}));

// eslint-disable-next-line import-x/first
import { unwrap, UserError } from '@/lib/actionResult';
// eslint-disable-next-line import-x/first
import {
  getMyRidePassengers,
  invitePassenger,
  leaveRide,
  removePassenger,
  respondToInvite,
} from '@/lib/passengers';
// eslint-disable-next-line import-x/first
import { requireVerifiedUser } from '@/lib/session';

const driver = { id: 'driver', name: 'Driver', email: 'driver@wpi.edu' };
const rider = { id: 'rider', name: 'Rider', email: 'rider@wpi.edu' };

const rideConversation = (status = 'OPEN') => ({
  participants: [{ userId: driver.id }, { userId: rider.id }],
  ridePost: { id: 'ride-1', creatorId: driver.id, status },
});

interface UpdateManyArgs {
  where: Record<string, unknown>;
  data: Record<string, unknown>;
}

const ridePostUpdates = (): UpdateManyArgs[] =>
  prisma.ridePost.updateMany.mock.calls.map(([args]) => args as UpdateManyArgs);

beforeEach(() => {
  prisma.conversation.findUnique.mockResolvedValue(rideConversation());
  prisma.ridePost.updateMany.mockResolvedValue({ count: 1 });
  prisma.ridePassenger.updateMany.mockResolvedValue({ count: 1 });
  prisma.ridePassenger.deleteMany.mockResolvedValue({ count: 1 });
  prisma.ridePassenger.findUnique.mockResolvedValue(null);
});

const unverified = () =>
  vi.mocked(requireVerifiedUser).mockRejectedValueOnce(new UserError('Verify your email address'));

describe('passenger actions require a verified email', () => {
  it.each([
    ['invitePassenger', async () => unwrap(invitePassenger('c1'))],
    ['respondToInvite', async () => unwrap(respondToInvite('c1', true))],
    ['leaveRide', async () => unwrap(leaveRide('c1'))],
    ['removePassenger', async () => unwrap(removePassenger('c1'))],
  ])('%s refuses unverified users', async (_name, call) => {
    unverified();
    await expect(call()).rejects.toThrow('Verify your email');
    expect(prisma.conversation.findUnique).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('conversation scoping', () => {
  it.each([
    ['invitePassenger', async () => unwrap(invitePassenger('c1'))],
    ['respondToInvite', async () => unwrap(respondToInvite('c1', true))],
    ['leaveRide', async () => unwrap(leaveRide('c1'))],
    ['removePassenger', async () => unwrap(removePassenger('c1'))],
  ])('%s rejects users outside the conversation', async (_name, call) => {
    requireUser.mockResolvedValue({ id: 'stranger', name: 'S', email: 's@wpi.edu' });
    await expect(call()).rejects.toThrow('Not a participant');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects conversations that are not about a ride', async () => {
    requireUser.mockResolvedValue(driver);
    prisma.conversation.findUnique.mockResolvedValue({
      participants: [{ userId: driver.id }, { userId: rider.id }],
      ridePost: null,
    });
    await expect(unwrap(invitePassenger('c1'))).rejects.toThrow('not about a ride');
  });
});

describe('invitePassenger', () => {
  beforeEach(() => requireUser.mockResolvedValue(driver));

  it('invites the other participant and tells them in the chat', async () => {
    await unwrap(invitePassenger('c1'));

    expect(prisma.ridePassenger.upsert).toHaveBeenCalledWith({
      where: { ridePostId_userId: { ridePostId: 'ride-1', userId: rider.id } },
      create: { ridePostId: 'ride-1', userId: rider.id },
      update: { status: 'INVITED' },
    });
    expect(prisma.message.create).toHaveBeenCalledWith({
      data: {
        conversationId: 'c1',
        senderId: driver.id,
        content: expect.stringContaining('Invited'),
      },
    });
  });

  it('can re-invite a rider who declined', async () => {
    prisma.ridePassenger.findUnique.mockResolvedValue({ status: 'DECLINED' });
    await unwrap(invitePassenger('c1'));
    expect(prisma.ridePassenger.upsert).toHaveBeenCalled();
  });

  it('only lets the driver invite', async () => {
    requireUser.mockResolvedValue(rider);
    await expect(unwrap(invitePassenger('c1'))).rejects.toThrow('Only the driver');
  });

  it('refuses rides that are not open', async () => {
    prisma.conversation.findUnique.mockResolvedValue(rideConversation('FULL'));
    await expect(unwrap(invitePassenger('c1'))).rejects.toThrow('not open');
  });

  it.each([
    ['ACCEPTED', 'Already on this ride'],
    ['INVITED', 'Already invited'],
  ])('refuses to re-invite a rider who is %s', async (status, message) => {
    prisma.ridePassenger.findUnique.mockResolvedValue({ status });
    await expect(unwrap(invitePassenger('c1'))).rejects.toThrow(message);
    expect(prisma.ridePassenger.upsert).not.toHaveBeenCalled();
  });
});

describe('respondToInvite', () => {
  beforeEach(() => requireUser.mockResolvedValue(rider));

  it('accepting takes a seat without overbooking and marks the ride full when it fills', async () => {
    await unwrap(respondToInvite('c1', true));

    expect(prisma.ridePassenger.updateMany).toHaveBeenCalledWith({
      where: { ridePostId: 'ride-1', userId: rider.id, status: 'INVITED' },
      data: { status: 'ACCEPTED' },
    });
    const [takeSeat, markFull] = ridePostUpdates();
    expect(takeSeat).toEqual({
      where: { id: 'ride-1', status: 'OPEN', seatsTaken: { lt: 'ref:seatsAvailable' } },
      data: { seatsTaken: { increment: 1 } },
    });
    expect(markFull).toEqual({
      where: { id: 'ride-1', status: 'OPEN', seatsTaken: { gte: 'ref:seatsAvailable' } },
      data: { status: 'FULL' },
    });
  });

  it('fails (rolling back the accept) when the last seat is gone', async () => {
    prisma.ridePost.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(unwrap(respondToInvite('c1', true))).rejects.toThrow('no seats left');
    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  it('declining frees nothing and takes no seat', async () => {
    await unwrap(respondToInvite('c1', false));

    expect(prisma.ridePassenger.updateMany.mock.calls[0][0].data).toEqual({ status: 'DECLINED' });
    expect(prisma.ridePost.updateMany).not.toHaveBeenCalled();
  });

  it('requires a pending invite', async () => {
    prisma.ridePassenger.updateMany.mockResolvedValue({ count: 0 });
    await expect(unwrap(respondToInvite('c1', true))).rejects.toThrow('No pending invite');
    expect(prisma.ridePost.updateMany).not.toHaveBeenCalled();
  });

  it('only lets the rider respond', async () => {
    requireUser.mockResolvedValue(driver);
    await expect(unwrap(respondToInvite('c1', true))).rejects.toThrow('Only the invited rider');
  });
});

describe('leaveRide', () => {
  beforeEach(() => requireUser.mockResolvedValue(rider));

  it('frees the seat and reopens a full ride', async () => {
    await unwrap(leaveRide('c1'));

    expect(prisma.ridePassenger.deleteMany).toHaveBeenCalledWith({
      where: { ridePostId: 'ride-1', userId: rider.id, status: 'ACCEPTED' },
    });
    const [release, reopen] = ridePostUpdates();
    expect(release).toEqual({
      where: { id: 'ride-1', seatsTaken: { gt: 0 } },
      data: { seatsTaken: { decrement: 1 } },
    });
    expect(reopen).toEqual({
      where: { id: 'ride-1', status: 'FULL', seatsTaken: { lt: 'ref:seatsAvailable' } },
      data: { status: 'OPEN' },
    });
  });

  it('requires having joined', async () => {
    prisma.ridePassenger.deleteMany.mockResolvedValue({ count: 0 });
    await expect(unwrap(leaveRide('c1'))).rejects.toThrow('not on this ride');
    expect(prisma.ridePost.updateMany).not.toHaveBeenCalled();
  });

  it('refuses rides that already ended', async () => {
    prisma.conversation.findUnique.mockResolvedValue(rideConversation('COMPLETED'));
    await expect(unwrap(leaveRide('c1'))).rejects.toThrow('already ended');
  });
});

describe('removePassenger', () => {
  beforeEach(() => requireUser.mockResolvedValue(driver));

  it('cancelling an invite frees no seat', async () => {
    prisma.ridePassenger.findUnique.mockResolvedValue({ status: 'INVITED' });

    await unwrap(removePassenger('c1'));

    expect(prisma.ridePassenger.deleteMany).toHaveBeenCalledWith({
      where: { ridePostId: 'ride-1', userId: rider.id, status: 'INVITED' },
    });
    expect(prisma.ridePost.updateMany).not.toHaveBeenCalled();
  });

  it('removing a rider frees their seat', async () => {
    prisma.ridePassenger.findUnique.mockResolvedValue({ status: 'ACCEPTED' });

    await unwrap(removePassenger('c1'));

    expect(ridePostUpdates()[0].data).toEqual({ seatsTaken: { decrement: 1 } });
  });

  it('fails if the invite changed underneath (e.g. accepted at the same moment)', async () => {
    prisma.ridePassenger.findUnique.mockResolvedValue({ status: 'INVITED' });
    prisma.ridePassenger.deleteMany.mockResolvedValue({ count: 0 });

    await expect(unwrap(removePassenger('c1'))).rejects.toThrow('try again');
    expect(prisma.ridePost.updateMany).not.toHaveBeenCalled();
  });

  it('only lets the driver remove riders', async () => {
    requireUser.mockResolvedValue(rider);
    await expect(unwrap(removePassenger('c1'))).rejects.toThrow('Only the driver');
  });
});

describe('getMyRidePassengers', () => {
  it("lists only riders who joined the caller's rides, grouped by ride", async () => {
    requireUser.mockResolvedValue(driver);
    const a = { id: 'a', name: 'A', image: null };
    const b = { id: 'b', name: 'B', image: null };
    prisma.ridePassenger.findMany.mockResolvedValue([
      { ridePostId: 'ride-1', user: a },
      { ridePostId: 'ride-2', user: b },
      { ridePostId: 'ride-1', user: b },
    ]);

    expect(await getMyRidePassengers()).toEqual({ 'ride-1': [a, b], 'ride-2': [b] });
    expect(prisma.ridePassenger.findMany.mock.calls[0][0].where).toEqual({
      status: 'ACCEPTED',
      ridePost: { creatorId: driver.id },
    });
  });
});
