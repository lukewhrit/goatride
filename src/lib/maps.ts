'use server';

import { resolvePlace } from '@/lib/places';
import { requireUser } from '@/lib/session';

import type { GeocodedPlace } from '@/lib/geocoding';

// eslint-disable-next-line import-x/prefer-default-export
export async function geocode(unformatted: string): Promise<GeocodedPlace> {
  await requireUser();

  return resolvePlace(unformatted);
}
