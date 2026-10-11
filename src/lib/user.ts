'use server';

import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';

/**
 * Starts an email change for the signed-in user. Requires the current password so a hijacked
 * session alone can't be used to take over the account. The change only takes effect once the
 * emailed link is followed (see changeEmail in lib/auth.ts).
 */
// eslint-disable-next-line import-x/prefer-default-export
export async function changeEmail(newEmail: string, currentPassword: string): Promise<void> {
  const user = await requireUser();

  const account = await prisma.account.findFirst({
    where: { userId: user.id, providerId: 'credential' },
    select: { password: true },
  });
  const ctx = await auth.$context;
  const valid =
    !!account?.password &&
    (await ctx.password.verify({ hash: account.password, password: currentPassword }));
  if (!valid) throw new Error('Current password is incorrect');

  await auth.api.changeEmail({
    body: { newEmail, callbackURL: '/settings' },
    headers: await headers(),
  });
}
