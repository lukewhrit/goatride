import { beforeEach, describe, expect, it, vi } from 'vitest';

import { unwrap, UserError } from '@/lib/actionResult';
import { uploadAvatar } from '@/lib/avatars';
import { avatarKeyFromUrl, deleteUserAvatars, validateAvatarFile } from '@/lib/avatarStorage';
import { requireVerifiedUser } from '@/lib/session';

const { blob, prisma, requireUser, updateUser } = vi.hoisted(() => ({
  blob: { put: vi.fn(), del: vi.fn(), list: vi.fn() },
  prisma: { user: { findUnique: vi.fn() } },
  requireUser: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('@vercel/blob', () => blob);
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@/lib/auth', () => ({ auth: { api: { updateUser } } }));
vi.mock('@/lib/prisma', () => ({ default: prisma }));
// Actions that change data use requireVerifiedUser; by default it returns the same user
vi.mock('@/lib/session', () => ({
  requireUser,
  requireVerifiedUser: vi.fn(async (): Promise<unknown> => requireUser()),
}));

const me = { id: 'user-me', name: 'Me', email: 'me@wpi.edu' };
const BLOB_HOST = 'https://abc123.public.blob.vercel-storage.com';

const form = (file: Blob | string | null) => {
  const fd = new FormData();
  if (file !== null) fd.set('avatar', file);
  return fd;
};

const webp = (bytes = 100) => new File([new Uint8Array(bytes)], 'avatar', { type: 'image/webp' });

beforeEach(() => {
  requireUser.mockResolvedValue(me);
  prisma.user.findUnique.mockResolvedValue({ image: null });
  blob.put.mockImplementation(async (pathname: string) => ({ url: `${BLOB_HOST}/${pathname}` }));
});

describe('validateAvatarFile', () => {
  it('accepts small WebP/PNG/JPEG files', () => {
    expect(validateAvatarFile({ type: 'image/webp', size: 1000 })).toBeNull();
    expect(validateAvatarFile({ type: 'image/png', size: 1000 })).toBeNull();
    expect(validateAvatarFile({ type: 'image/jpeg', size: 1000 })).toBeNull();
  });

  it('rejects other types, empty files, and files over 512 KB', () => {
    expect(validateAvatarFile({ type: 'image/svg+xml', size: 10 })).toMatch('WebP, PNG, or JPEG');
    expect(validateAvatarFile({ type: 'text/html', size: 10 })).toMatch('WebP, PNG, or JPEG');
    expect(validateAvatarFile({ type: 'image/png', size: 0 })).toMatch('empty');
    expect(validateAvatarFile({ type: 'image/png', size: 512 * 1024 + 1 })).toMatch('512 KB');
  });
});

describe('avatarKeyFromUrl', () => {
  it('only maps our own Blob avatar URLs to keys', () => {
    expect(avatarKeyFromUrl(`${BLOB_HOST}/avatars/u1/abc.webp`)).toBe('avatars/u1/abc.webp');
    expect(avatarKeyFromUrl(`${BLOB_HOST}/other/u1/abc.webp`)).toBeNull();
    expect(avatarKeyFromUrl('https://example.com/avatars/u1/abc.webp')).toBeNull();
    expect(avatarKeyFromUrl('https://evil.com/x.blob.vercel-storage.com/avatars/a')).toBeNull();
    expect(avatarKeyFromUrl('data:image/png;base64,AAAA')).toBeNull();
    expect(avatarKeyFromUrl(null)).toBeNull();
  });
});

describe('uploadAvatar', () => {
  it('requires a session', async () => {
    requireUser.mockRejectedValue(new Error('Not authenticated'));
    await expect(unwrap(uploadAvatar(form(webp())))).rejects.toThrow('Not authenticated');
    expect(blob.put).not.toHaveBeenCalled();
  });

  it('requires a verified email', async () => {
    vi.mocked(requireVerifiedUser).mockRejectedValueOnce(
      new UserError('Verify your email address'),
    );
    await expect(unwrap(uploadAvatar(form(webp())))).rejects.toThrow('Verify your email');
    expect(blob.put).not.toHaveBeenCalled();
  });

  it('rejects missing and invalid files before storing anything', async () => {
    await expect(unwrap(uploadAvatar(form(null)))).rejects.toThrow('No avatar');
    await expect(unwrap(uploadAvatar(form('not a file')))).rejects.toThrow('No avatar');
    await expect(
      unwrap(uploadAvatar(form(new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' })))),
    ).rejects.toThrow('WebP, PNG, or JPEG');
    expect(blob.put).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("stores a public blob under the user's prefix and points the user at it", async () => {
    const url = await unwrap(uploadAvatar(form(webp())));

    const [pathname, , opts] = blob.put.mock.calls[0];
    expect(pathname).toMatch(/^avatars\/user-me\/[\w-]+\.webp$/);
    expect(opts).toEqual({ access: 'public', contentType: 'image/webp', addRandomSuffix: false });
    expect(url).toBe(`${BLOB_HOST}/${pathname}`);
    expect(updateUser.mock.calls[0][0].body).toEqual({ image: url });
  });

  it('deletes the previous stored avatar after switching', async () => {
    prisma.user.findUnique.mockResolvedValue({ image: `${BLOB_HOST}/avatars/user-me/old.webp` });

    await unwrap(uploadAvatar(form(webp())));

    expect(blob.del).toHaveBeenCalledWith('avatars/user-me/old.webp');
    expect(updateUser.mock.invocationCallOrder[0]).toBeLessThan(
      blob.del.mock.invocationCallOrder[0],
    );
  });

  it('leaves images that are not ours alone', async () => {
    prisma.user.findUnique.mockResolvedValue({ image: 'data:image/png;base64,AAAA' });
    await unwrap(uploadAvatar(form(webp())));
    expect(blob.del).not.toHaveBeenCalled();
  });
});

describe('deleteUserAvatars', () => {
  it("deletes every page of the user's avatars", async () => {
    blob.list
      .mockResolvedValueOnce({ blobs: [{ url: 'u/a' }], hasMore: true, cursor: 'c1' })
      .mockResolvedValueOnce({ blobs: [{ url: 'u/b' }], hasMore: false });

    await deleteUserAvatars('u1');

    expect(blob.list).toHaveBeenNthCalledWith(1, { prefix: 'avatars/u1/', cursor: undefined });
    expect(blob.list).toHaveBeenNthCalledWith(2, { prefix: 'avatars/u1/', cursor: 'c1' });
    expect(blob.del).toHaveBeenCalledWith(['u/a']);
    expect(blob.del).toHaveBeenCalledWith(['u/b']);
  });
});
