import { headers } from 'next/headers';

import { auth } from '@/lib/auth';

/**
 * Resolves the signed-in user from the request cookies. Server actions are public endpoints, so
 * every action that acts on behalf of a user must call this instead of trusting client input.
 */
// eslint-disable-next-line import-x/prefer-default-export
export async function requireUser(): Promise<{ id: string; name: string; email: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Not authenticated');
  return session.user;
}
