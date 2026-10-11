import { getSessionCookie } from 'better-auth/cookies';
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

/*
 * Optimistic redirect for signed-out users. This only checks that a session cookie exists; the
 * server actions still validate the session itself, so this is a UX guard, not authorization.
 */
export function proxy(request: NextRequest): NextResponse {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/posts/:path*', '/messages/:path*', '/settings/:path*'],
};
