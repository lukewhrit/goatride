'use server';

import { headers } from 'next/headers';

import { toResult, UserError } from '@/lib/actionResult';
import { auth } from '@/lib/auth';
import {
  avatarKeyFromUrl,
  deleteAvatar,
  storeAvatar,
  validateAvatarFile,
} from '@/lib/avatarStorage';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';

import type { ActionResult } from '@/lib/actionResult';

/**
 * Stores an avatar (already resized in the browser) in Vercel Blob, points the user at it, and
 * deletes the previous one. Returns the new avatar URL.
 */
// eslint-disable-next-line import-x/prefer-default-export
export async function uploadAvatar(formData: FormData): Promise<ActionResult<string>> {
  const user = await requireUser();

  return toResult(async () => {
    const file = formData.get('avatar');
    if (!(file instanceof File)) throw new UserError('No avatar uploaded');
    const invalid = validateAvatarFile(file);
    if (invalid) throw new UserError(invalid);

    const url = await storeAvatar(user.id, file);

    const current = await prisma.user.findUnique({
      where: { id: user.id },
      select: { image: true },
    });

    await auth.api.updateUser({ body: { image: url }, headers: await headers() });

    const oldKey = avatarKeyFromUrl(current?.image);
    if (oldKey) await deleteAvatar(oldKey);

    return url;
  });
}
