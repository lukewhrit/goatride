import { Client, PlaceType2 } from '@googlemaps/google-maps-services-js';

import type { AddressComponent, LatLngLiteral } from '@googlemaps/google-maps-services-js';

/*
 * Raw Google Geocoding calls with no session check. Only import this from server code that has
 * already authenticated the caller (server actions) or from trusted scripts; the browser-callable
 * wrapper lives in `@/lib/maps`.
 */

const client = new Client({});

export const UNKNOWN_PLACE = 'Unknown location';

export interface GeocodedPlace extends LatLngLiteral {
  /** Short display name, e.g. "Worcester, MA". */
  name: string;
}

/*
 * Prefer a server-only key (restricted by API, never shipped to the browser). The public key is a
 * fallback for local development only; in production it should be restricted to HTTP referrers,
 * which means server-side calls with it will be rejected by Google.
 */
const apiKey = (): string => {
  // `||` so an empty `GOOGLE_MAPS_SERVER_KEY=` line in .env still falls back
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const key = process.env.GOOGLE_MAPS_SERVER_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error('Google Maps API key is not configured');
  return key;
};

const placeName = (components: AddressComponent[] | undefined): string => {
  const town = components?.find((e) => e.types.includes(PlaceType2.locality));
  const state = components?.find((e) => e.types.includes(PlaceType2.administrative_area_level_1));

  return [town?.short_name, state?.short_name].filter(Boolean).join(', ') || UNKNOWN_PLACE;
};

export async function geocodeAddress(address: string): Promise<GeocodedPlace> {
  const res = await client.geocode({
    params: { key: apiKey(), address },
  });

  const result = res.data.results[0];
  if (!result) throw new Error(`Could not find a location for "${address}"`);

  return { ...result.geometry.location, name: placeName(result.address_components) };
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const res = await client.reverseGeocode({
    params: { key: apiKey(), latlng: { lat, lng } },
  });

  return placeName(res.data.results[0]?.address_components);
}
