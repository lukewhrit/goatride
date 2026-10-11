import { del, list, put } from '@vercel/blob';

/*
 * Avatars live in Vercel Blob under `avatars/<userId>/<uuid>.<ext>` and are served straight from
 * their public Blob URL. Keys are never reused, so each URL's content never changes. The SDK reads
 * BLOB_READ_WRITE_TOKEN, which Vercel sets when a Blob store is connected to the project.
 */

export const MAX_AVATAR_BYTES = 512 * 1024;

const EXTENSIONS: Record<string, string> = {
  'image/webp': 'webp',
  'image/png': 'png',
  'image/jpeg': 'jpg',
};

/** Returns an error message, or null if the file is an acceptable avatar. */
export const validateAvatarFile = (file: { type: string; size: number }): string | null => {
  if (!(file.type in EXTENSIONS)) return 'Avatar must be a WebP, PNG, or JPEG image';
  if (file.size === 0) return 'Avatar file is empty';
  if (file.size > MAX_AVATAR_BYTES) return 'Avatar must be under 512 KB';
  return null;
};

/** Uploads an already-validated avatar and returns its public URL. */
export async function storeAvatar(userId: string, file: File): Promise<string> {
  const key = `avatars/${userId}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
  const blob = await put(key, file, {
    access: 'public',
    contentType: file.type,
    addRandomSuffix: false,
  });
  return blob.url;
}

/** The Blob pathname behind an avatar URL, or null if the URL isn't one of ours. */
export const avatarKeyFromUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  try {
    const { hostname, pathname } = new URL(url);
    if (!hostname.endsWith('.blob.vercel-storage.com') || !pathname.startsWith('/avatars/')) {
      return null;
    }
    return pathname.slice(1);
  } catch {
    return null; // e.g. legacy data: URLs or empty strings
  }
};

/** Removes every stored avatar for a user (account deletion). */
export async function deleteUserAvatars(userId: string): Promise<void> {
  let cursor: string | undefined;
  do {
    // eslint-disable-next-line no-await-in-loop
    const page = await list({ prefix: `avatars/${userId}/`, cursor });
    if (page.blobs.length) {
      // eslint-disable-next-line no-await-in-loop
      await del(page.blobs.map((b) => b.url));
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
}

export { del as deleteAvatar };
