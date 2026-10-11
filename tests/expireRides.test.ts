import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma } = vi.hoisted(() => ({
  prisma: { ridePost: { updateMany: vi.fn() } },
}));

vi.mock('@/lib/prisma', () => ({ default: prisma }));

// eslint-disable-next-line import-x/first
import { GET } from '@/app/api/cron/expire-rides/route';
// eslint-disable-next-line import-x/first
import { expireRides, EXPIRY_GRACE_MS } from '@/lib/rideMaintenance';

beforeEach(() => {
  prisma.ridePost.updateMany.mockResolvedValue({ count: 2 });
});

describe('expireRides', () => {
  it('completes open/full rides more than a day past departure', async () => {
    const now = new Date('2026-10-11T12:00:00Z');

    await expect(expireRides(now)).resolves.toBe(2);

    const { where, data } = prisma.ridePost.updateMany.mock.calls[0][0];
    expect(where.status).toEqual({ in: ['OPEN', 'FULL'] });
    expect(where.departureTime.lt).toEqual(new Date(now.getTime() - EXPIRY_GRACE_MS));
    expect(data).toEqual({ status: 'COMPLETED' });
  });
});

describe('GET /api/cron/expire-rides', () => {
  const call = async (authorization?: string) =>
    GET(
      new Request('https://goatride.example/api/cron/expire-rides', {
        headers: authorization ? { authorization } : {},
      }),
    );

  beforeEach(() => vi.stubEnv('CRON_SECRET', 'cron-secret'));
  afterEach(() => vi.unstubAllEnvs());

  it('rejects missing or wrong secrets without touching the database', async () => {
    expect((await call()).status).toBe(401);
    expect((await call('Bearer nope')).status).toBe(401);
    expect((await call('cron-secret')).status).toBe(401);
    expect(prisma.ridePost.updateMany).not.toHaveBeenCalled();
  });

  it('refuses every request when no secret is configured', async () => {
    vi.stubEnv('CRON_SECRET', '');
    expect((await call('Bearer ')).status).toBe(401);
  });

  it('expires rides with the right secret', async () => {
    const res = await call('Bearer cron-secret');
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ expired: 2 });
  });
});
