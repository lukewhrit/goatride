import { cache } from 'react';

import { headers } from 'next/headers';

import { auth } from '@/lib/auth';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

/*
 * Memoized per request: a server component and the server functions it calls (e.g. a page and
 * `fetchPosts`) share one session lookup instead of each hitting the database.
 */
const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** The signed-in user, or null. Use in server components that redirect signed-out visitors. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  return (await getSession())?.user ?? null;
}

/**
 * Resolves the signed-in user from the request cookies. Server actions are public endpoints, so
 * every action that acts on behalf of a user must call this instead of trusting client input.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}
