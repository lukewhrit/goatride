/*
 * Raw Google Geocoding calls with no session check. Only import this from server code that has
 * already authenticated the caller (server actions); the browser-callable wrapper lives in
 * `@/lib/maps`. Plain fetch rather than Google's SDK: it's two query params and no extra dependency.
 */

import { UserError } from '@/lib/actionResult';

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

export const UNKNOWN_PLACE = 'Unknown location';

export interface GeocodedPlace {
  lat: number;
  lng: number;
  /** Short display name, e.g. "Worcester, MA". */
  name: string;
}

interface AddressComponent {
  short_name: string;
  types: string[];
}

interface GeocodeResponse {
  status: string;
  error_message?: string;
  results: {
    address_components: AddressComponent[];
    geometry: { location: { lat: number; lng: number } };
  }[];
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
  const town = components?.find((e) => e.types.includes('locality'));
  const state = components?.find((e) => e.types.includes('administrative_area_level_1'));

  return [town?.short_name, state?.short_name].filter(Boolean).join(', ') || UNKNOWN_PLACE;
};

export async function geocodeAddress(address: string): Promise<GeocodedPlace> {
  const url = new URL(GEOCODE_URL);
  url.searchParams.set('address', address);
  url.searchParams.set('key', apiKey());

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding request failed (${res.status})`);

  // Google reports most failures (bad key, quota) as HTTP 200 with a non-OK status
  const data = (await res.json()) as GeocodeResponse;
  const result = data.results[0];
  if (data.status === 'ZERO_RESULTS' || (data.status === 'OK' && !result)) {
    throw new UserError(`Could not find a location for "${address}"`);
  }
  if (data.status !== 'OK' || !result) {
    throw new Error(
      `Geocoding failed: ${data.status}${data.error_message ? ` (${data.error_message})` : ''}`,
    );
  }

  return { ...result.geometry.location, name: placeName(result.address_components) };
}
