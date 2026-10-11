import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma, requireUser, geocodeAddress } = vi.hoisted(() => ({
  prisma: {
    ridePost: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
  requireUser: vi.fn(),
  geocodeAddress: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ default: prisma }));
vi.mock('@/lib/session', () => ({ requireUser }));
vi.mock('@/lib/geocoding', () => ({ geocodeAddress, UNKNOWN_PLACE: 'Unknown location' }));

// eslint-disable-next-line import-x/first
import { deletePost, fetchPosts, publishPost, updatePost } from '@/lib/posts';

const me = { id: 'user-me', name: 'Me', email: 'me@wpi.edu' };

beforeEach(() => {
  requireUser.mockResolvedValue(me);
  geocodeAddress.mockImplementation(async (address: string) => ({
    lat: 42.27,
    lng: -71.8,
    name: address,
  }));
});

describe('ride post actions require a session', () => {
  beforeEach(() => {
    requireUser.mockRejectedValue(new Error('Not authenticated'));
  });

  it.each([
    ['fetchPosts', async () => fetchPosts({ page: 1, rideStatus: 'OPEN' })],
    ['publishPost', async () => publishPost({} as never)],
    ['updatePost', async () => updatePost('post-1', {})],
    ['deletePost', async () => deletePost('post-1')],
  ])('%s rejects anonymous callers', async (_name, call) => {
    await expect(call()).rejects.toThrow('Not authenticated');
    expect(prisma.ridePost.findMany).not.toHaveBeenCalled();
    expect(prisma.ridePost.create).not.toHaveBeenCalled();
    expect(prisma.ridePost.update).not.toHaveBeenCalled();
    expect(prisma.ridePost.delete).not.toHaveBeenCalled();
  });
});

describe('fetchPosts', () => {
  it('only exposes public creator fields', async () => {
    prisma.ridePost.findMany.mockResolvedValue([]);
    prisma.ridePost.count.mockResolvedValue(0);

    await fetchPosts({ page: 1, rideStatus: 'OPEN' });

    expect(prisma.ridePost.findMany.mock.calls[0][0].include).toEqual({
      creator: { select: { id: true, name: true, image: true } },
    });
  });

  it('clamps page size and page number', async () => {
    prisma.ridePost.findMany.mockResolvedValue([]);
    prisma.ridePost.count.mockResolvedValue(0);

    const res = await fetchPosts({ page: -5, pageSize: 10_000, rideStatus: 'ALL' });

    expect(res.page).toBe(1);
    expect(res.pageSize).toBe(50);
    expect(res.totalPages).toBe(1);
  });

  it('returns stored place names without geocoding', async () => {
    prisma.ridePost.findMany.mockResolvedValue([
      { id: 'a', price: null, originName: 'Worcester, MA', destinationName: 'Boston, MA' },
      { id: 'b', price: null, originName: null, destinationName: null },
    ]);
    prisma.ridePost.count.mockResolvedValue(2);

    const { items } = await fetchPosts({ page: 1, rideStatus: 'OPEN' });

    expect(items.map((p) => [p.origin, p.destination])).toEqual([
      ['Worcester, MA', 'Boston, MA'],
      ['Unknown location', 'Unknown location'],
    ]);
    expect(geocodeAddress).not.toHaveBeenCalled();
  });
});

describe('publishPost', () => {
  it('creates the post as the session user and validates input', async () => {
    prisma.ridePost.create.mockResolvedValue({ id: 'post-1', price: null });

    await publishPost({
      origin: 'Worcester, MA',
      destination: 'Boston, MA',
      departureDate: '2026-12-20',
      seatsAvailable: 2,
      seatPrice: 5,
      comments: '',
    });

    const { data } = prisma.ridePost.create.mock.calls[0][0];
    expect(data.creator).toEqual({ connect: { id: me.id } });
    expect(data.notes).toBe('N/A');
    expect(data.originName).toBe('Worcester, MA');
    expect(data.destinationName).toBe('Boston, MA');
  });

  it('rejects invalid input before touching the database', async () => {
    await expect(
      publishPost({
        origin: 'A',
        destination: 'B',
        departureDate: '2026-12-20',
        seatsAvailable: 0,
        seatPrice: 0,
      }),
    ).rejects.toThrow();
    expect(geocodeAddress).not.toHaveBeenCalled();
    expect(prisma.ridePost.create).not.toHaveBeenCalled();
  });
});

describe('updatePost / deletePost', () => {
  it('scopes updates to posts owned by the session user', async () => {
    await updatePost('post-1', { seatsAvailable: 3 });

    const args = prisma.ridePost.update.mock.calls[0][0];
    expect(args.where).toEqual({ id: 'post-1', creatorId: me.id });
    expect(args.data.seatsAvailable).toBe(3);
    expect(args.data).not.toHaveProperty('notes');
    expect(args.data).not.toHaveProperty('originName');
    expect(geocodeAddress).not.toHaveBeenCalled();
  });

  it('refreshes the stored place name when a location changes', async () => {
    await updatePost('post-1', { destination: 'Providence, RI' });

    const { data } = prisma.ridePost.update.mock.calls[0][0];
    expect(data.destinationName).toBe('Providence, RI');
    expect(data).not.toHaveProperty('originName');
  });

  it('ignores any extra user id smuggled in by the client', async () => {
    await updatePost('post-1', { seatsAvailable: 3, creatorId: 'victim' } as never);
    expect(prisma.ridePost.update.mock.calls[0][0].where.creatorId).toBe(me.id);
  });

  it('scopes deletes to posts owned by the session user', async () => {
    await deletePost('post-1');
    expect(prisma.ridePost.delete).toHaveBeenCalledWith({
      where: { id: 'post-1', creatorId: me.id },
    });
  });
});
