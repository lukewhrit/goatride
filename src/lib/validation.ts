// eslint-disable-next-line import-x/no-namespace
import * as z from 'zod';

import { RideStatus } from '@/generated/prisma/enums';

const place = z.string().trim().min(1, 'Required').max(200);
const departureDate = z
  .string()
  .min(1, 'Departure date is required')
  .refine((s) => !Number.isNaN(new Date(s).getTime()), 'Invalid date');

const postFields = z.object({
  origin: place,
  destination: place,
  departureDate,
  seatsAvailable: z.coerce.number().int().min(1).max(8),
  seatPrice: z.coerce.number().min(0).max(9999.99),
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
