import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));

vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession } } }));

// eslint-disable-next-line import-x/first
import { toResult, unwrap } from '@/lib/actionResult';
// eslint-disable-next-line import-x/first
import { requireUser, requireVerifiedUser } from '@/lib/session';

const me = { id: 'user-me', name: 'Me', email: 'me@wpi.edu', emailVerified: true };

beforeEach(() => {
  getSession.mockResolvedValue({ user: me });
});

describe('requireVerifiedUser', () => {
  it('returns verified users', async () => {
    await expect(requireVerifiedUser()).resolves.toEqual(me);
  });

  it('refuses unverified users with a message the user can see', async () => {
    getSession.mockResolvedValue({ user: { ...me, emailVerified: false } });
    await expect(unwrap(toResult(requireVerifiedUser))).rejects.toThrow(
      'verify your email address',
    );
  });

  it('still lets unverified users through requireUser', async () => {
    getSession.mockResolvedValue({ user: { ...me, emailVerified: false } });
    await expect(requireUser()).resolves.toMatchObject({ id: me.id });
  });

  it('refuses signed-out users', async () => {
    getSession.mockResolvedValue(null);
    await expect(requireVerifiedUser()).rejects.toThrow('Not authenticated');
  });
});
