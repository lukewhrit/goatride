import { describe, expect, it } from 'vitest';

import { publishPostSchema, updatePostSchema } from '@/lib/validation';

const valid = {
  origin: 'Worcester, MA',
  destination: 'Boston, MA',
  departureDate: '2026-12-20',
  seatsAvailable: '3',
  seatPrice: '12.50',
  comments: '',
};

describe('publishPostSchema', () => {
  it('coerces numeric strings from form inputs', () => {
    const parsed = publishPostSchema.parse(valid);
    expect(parsed.seatsAvailable).toBe(3);
    expect(parsed.seatPrice).toBe(12.5);
  });

  it('defaults comments to an empty string', () => {
    const rest: Partial<typeof valid> = { ...valid };
    delete rest.comments;
    expect(publishPostSchema.parse(rest).comments).toBe('');
  });

  it.each([
    ['empty origin', { origin: '   ' }],
    ['zero seats', { seatsAvailable: '0' }],
    ['too many seats', { seatsAvailable: '9' }],
    ['fractional seats', { seatsAvailable: '1.5' }],
    ['negative price', { seatPrice: '-1' }],
    ['huge price', { seatPrice: '10000' }],
    ['unparseable date', { departureDate: 'not a date' }],
    ['overlong comments', { comments: 'x'.repeat(1001) }],
  ])('rejects %s', (_label, override) => {
    expect(publishPostSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});

describe('updatePostSchema', () => {
  it('accepts a partial update without filling in defaults', () => {
    expect(updatePostSchema.parse({ seatsAvailable: 2 })).toEqual({ seatsAvailable: 2 });
  });

  it('accepts a valid status and rejects unknown ones', () => {
    expect(updatePostSchema.parse({ status: 'CANCELLED' }).status).toBe('CANCELLED');
    expect(updatePostSchema.safeParse({ status: 'DELETED' }).success).toBe(false);
  });
});
