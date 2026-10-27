import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma, geocodeAddress } = vi.hoisted(() => ({
  prisma: { ridePost: { findFirst: vi.fn() } },
  geocodeAddress: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ default: prisma }));
vi.mock('@/lib/geocoding', () => ({ geocodeAddress }));

// eslint-disable-next-line import-x/first
import { resolvePlace } from '@/lib/places';

const known = {
  originName: 'Worcester, MA',
  originLat: 42.26,
  originLng: -71.8,
  destinationName: 'Boston, MA',
  destinationLat: 42.36,
  destinationLng: -71.06,
};

beforeEach(() => {
  geocodeAddress.mockResolvedValue({ lat: 1, lng: 2, name: 'Elsewhere, MA' });
});

describe('resolvePlace', () => {
  it('reuses stored coordinates for a known town, ignoring case', async () => {
    prisma.ridePost.findFirst.mockResolvedValue(known);

    await expect(resolvePlace(' boston, ma ')).resolves.toEqual({
      lat: 42.36,
      lng: -71.06,
      name: 'Boston, MA',
    });
    await expect(resolvePlace('Worcester, MA')).resolves.toMatchObject({ lat: 42.26 });
    expect(geocodeAddress).not.toHaveBeenCalled();
  });

  it('falls back to Google for an unknown place', async () => {
    prisma.ridePost.findFirst.mockResolvedValue(null);

    await expect(resolvePlace('Elsewhere')).resolves.toMatchObject({ name: 'Elsewhere, MA' });
    expect(geocodeAddress).toHaveBeenCalledWith('Elsewhere');
  });
});
