import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { geocodeAddress } from '@/lib/geocoding';

const fetchMock = vi.fn();

const respond = (body: unknown, status = 200) =>
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('GOOGLE_MAPS_SERVER_KEY', 'server-key');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('geocodeAddress', () => {
  it('returns coordinates and a short "Town, ST" name', async () => {
    respond({
      status: 'OK',
      results: [
        {
          geometry: { location: { lat: 42.27, lng: -71.8 } },
          address_components: [
            { short_name: 'Worcester', types: ['locality', 'political'] },
            { short_name: 'MA', types: ['administrative_area_level_1', 'political'] },
            { short_name: 'US', types: ['country', 'political'] },
          ],
        },
      ],
    });

    await expect(geocodeAddress('Worcester, MA')).resolves.toEqual({
      lat: 42.27,
      lng: -71.8,
      name: 'Worcester, MA',
    });

    const url = new URL(fetchMock.mock.calls[0][0] as URL);
    expect(url.searchParams.get('address')).toBe('Worcester, MA');
    expect(url.searchParams.get('key')).toBe('server-key');
  });

  it('falls back to the public key when the server key is empty', async () => {
    vi.stubEnv('GOOGLE_MAPS_SERVER_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', 'public-key');
    respond({ status: 'ZERO_RESULTS', results: [] });

    await expect(geocodeAddress('x')).rejects.toThrow();
    expect(new URL(fetchMock.mock.calls[0][0] as URL).searchParams.get('key')).toBe('public-key');
  });

  it('reports addresses Google cannot find', async () => {
    respond({ status: 'ZERO_RESULTS', results: [] });
    await expect(geocodeAddress('Nowhere')).rejects.toThrow('Could not find a location');
  });

  it('surfaces API errors that arrive as HTTP 200', async () => {
    respond({ status: 'REQUEST_DENIED', error_message: 'API key invalid', results: [] });
    await expect(geocodeAddress('Boston')).rejects.toThrow('REQUEST_DENIED (API key invalid)');
  });

  it('surfaces HTTP failures', async () => {
    respond({}, 503);
    await expect(geocodeAddress('Boston')).rejects.toThrow('503');
  });
});
