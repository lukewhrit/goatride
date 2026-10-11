import { timingSafeEqual } from 'node:crypto';

import { expireRides } from '@/lib/rideMaintenance';

/*
 * Called daily by Vercel Cron (see vercel.json), which sends `Authorization: Bearer $CRON_SECRET`.
 * It's a public URL, so it only runs with that secret; you can also trigger it by hand with curl.
 */
const authorized = (request: Request): boolean => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const given = Buffer.from(request.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
};

export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) return new Response('Unauthorized', { status: 401 });

  const expired = await expireRides();
  return Response.json({ expired });
}
