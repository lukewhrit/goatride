'use server';

import { Client, PlaceType2 } from '@googlemaps/google-maps-services-js';

import { requireUser } from '@/lib/session';

import type { LatLngLiteral } from '@googlemaps/google-maps-services-js';

const client = new Client({});

/*
 * Prefer a server-only key (restricted by IP / API, never shipped to the browser). The public key is
 * a fallback for local development only; in production it should be restricted to HTTP referrers,
 * which means server-side calls with it will be rejected by Google.
 */
const apiKey = (): string => {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error('Google Maps API key is not configured');
  return key;
};

export async function geocode(unformatted: string): Promise<LatLngLiteral> {
  await requireUser();

  const res = await client.geocode({
    params: { key: apiKey(), address: unformatted },
  });

  const result = res.data.results[0];
  if (!result) throw new Error(`Could not find a location for "${unformatted}"`);

  return result.geometry.location;
}

export async function ungeocode(lat: number, lng: number): Promise<string> {
  await requireUser();

  const res = await client.reverseGeocode({
    params: { key: apiKey(), latlng: { lat, lng } },
  });

  const ac = res.data.results[0]?.address_components;

  const town = ac?.find((e) => e.types.includes(PlaceType2.locality));
  const state = ac?.find((e) => e.types.includes(PlaceType2.administrative_area_level_1));

  return [town?.short_name, state?.short_name].filter(Boolean).join(', ') || 'Unknown location';
}
