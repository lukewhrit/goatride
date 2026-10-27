// eslint-disable-next-line import-x/no-namespace
import * as z from 'zod';

import { RideStatus } from '@/generated/prisma/enums';
import { DEFAULT_SEARCH_RADIUS_MILES, MAX_SEARCH_RADIUS_MILES } from '@/lib/distance';

const place = z.string().trim().min(1, 'Required').max(200);
const departureDate = z
  .string()
  .min(1, 'Departure date is required')
  .refine((s) => !Number.isNaN(new Date(s).getTime()), 'Invalid date');

const postFields = z.object({
  origin: place,
  destination: place,
  departureDate,
  seatsAvailable: z.coerce.number<string | number>().int().min(1).max(8),
  seatPrice: z.coerce.number<string | number>().min(0).max(9999.99),
  comments: z.string().max(1000),
});

export const publishPostSchema = postFields.extend({
  comments: postFields.shape.comments.default(''),
});

export const updatePostSchema = postFields.partial().extend({
  status: z.enum(RideStatus).optional(),
});

export type PublishPostInput = z.input<typeof publishPostSchema>;
export type UpdatePostInput = z.input<typeof updatePostSchema>;

/** A place to search around: rides whose route passes within `radiusMiles` of it. */
export const searchNearSchema = z.object({
  lat: z.coerce.number<string | number>().min(-90).max(90),
  lng: z.coerce.number<string | number>().min(-180).max(180),
  radiusMiles: z.coerce
    .number<string | number>()
    .min(1)
    .max(MAX_SEARCH_RADIUS_MILES)
    .default(DEFAULT_SEARCH_RADIUS_MILES),
});

export type SearchNearInput = z.input<typeof searchNearSchema>;

export const ALLOWED_EMAIL_DOMAIN = 'wpi.edu';
export const EMAIL_DOMAIN_MESSAGE = `Email must end with @${ALLOWED_EMAIL_DOMAIN}`;

/** Accounts are limited to campus addresses. Case-insensitive, since Better Auth lowercases. */
export const isAllowedEmail = (email: string): boolean =>
  email.trim().toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
