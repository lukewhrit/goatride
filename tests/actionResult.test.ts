import { describe, expect, it } from 'vitest';

import { ActionError, errorMessage, toResult, unwrap, UserError } from '@/lib/actionResult';

describe('toResult', () => {
  it('wraps a value', async () => {
    expect(await toResult(async () => 42)).toEqual({ ok: true, value: 42 });
  });

  it('returns user-facing errors instead of throwing them', async () => {
    const result = await toResult(async () => {
      throw new UserError('Could not find a location for "Nowhere"');
    });
    expect(result).toEqual({ ok: false, error: 'Could not find a location for "Nowhere"' });
  });

  it('still throws every other error, so internal details never reach the client', async () => {
    await expect(
      toResult(async () => {
        throw new Error('Google Maps API key is not configured');
      }),
    ).rejects.toThrow('API key');
  });
});

describe('unwrap / errorMessage', () => {
  it('returns the value of a successful result', async () => {
    expect(await unwrap(Promise.resolve({ ok: true as const, value: 'id' }))).toBe('id');
  });

  it('throws an ActionError carrying the user-facing message', async () => {
    const err = await unwrap({ ok: false, error: 'This ride has no seats left' }).catch(
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(ActionError);
    expect(errorMessage(err, 'fallback')).toBe('This ride has no seats left');
  });

  it('falls back to a generic message for anything else', () => {
    expect(
      errorMessage(new Error('An error occurred in the Server Components render'), 'Oops'),
    ).toBe('Oops');
  });
});
