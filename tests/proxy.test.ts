import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { config, proxy } from '@/proxy';

const request = (path: string, cookie?: string) =>
  new NextRequest(new URL(path, 'http://localhost:3000'), {
    headers: cookie ? { cookie } : {},
  });

describe('proxy', () => {
  it('redirects signed-out users to sign-in', () => {
    const res = proxy(request('/settings'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/sign-in');
  });

  it('lets requests with a session cookie through', () => {
    const res = proxy(request('/posts', 'better-auth.session_token=abc.def'));
    expect(res.headers.get('location')).toBeNull();
  });

  it('protects the signed-in areas of the app', () => {
    expect(config.matcher).toEqual(['/posts/:path*', '/messages/:path*', '/settings/:path*']);
  });
});
