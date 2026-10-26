import { cache } from 'react';

import { headers } from 'next/headers';

import { UserError } from '@/lib/actionResult';
import { auth } from '@/lib/auth';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
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

/**
 * Like `requireUser`, but also requires a verified email. Every action that changes data or
 * reaches other users must call this, inside `toResult` so the user sees why they were refused.
 * Sign-in doesn't require verification (see auth.ts), so this is what keeps unverified accounts
 * read-only.
 */
export async function requireVerifiedUser(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.emailVerified) throw new UserError('You need to verify your email address to do this');
  return user;
}
