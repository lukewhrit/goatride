'use server';

import { isAPIError } from 'better-auth/api';
import { headers } from 'next/headers';

import { toResult, UserError } from '@/lib/actionResult';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';

import type { ActionResult } from '@/lib/actionResult';

/**
 * Starts an email change for the signed-in user. Requires the current password so a hijacked
 * session alone can't be used to take over the account. The change only takes effect once the
 * emailed link is followed (see changeEmail in lib/auth.ts).
 */
// eslint-disable-next-line import-x/prefer-default-export
export async function changeEmail(
  newEmail: string,
  currentPassword: string,
): Promise<ActionResult<void>> {
  const user = await requireUser();

  return toResult(async () => {
    const account = await prisma.account.findFirst({
      where: { userId: user.id, providerId: 'credential' },
      select: { password: true },
    });
    const ctx = await auth.$context;
    const valid =
      !!account?.password &&
      (await ctx.password.verify({ hash: account.password, password: currentPassword }));
    if (!valid) throw new UserError('Current password is incorrect');

    try {
      await auth.api.changeEmail({
        body: { newEmail, callbackURL: '/settings' },
        headers: await headers(),
      });
    } catch (e) {
      // Better Auth's own messages (e.g. an email that's already in use) are meant for users
      if (isAPIError(e)) throw new UserError(e.message);
      throw e;
    }
  });
}
