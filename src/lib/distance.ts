/*
 * Plain geometry for ride search, safe to import from client and server code. Rides only store
 * their two endpoints, so the straight line between them stands in for the route actually driven.
 * That is close enough for picking up "on the way" trips over the distances we care about; real
 * routes would need a directions polyline saved with each post.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export const SEARCH_RADII_MILES = [5, 10, 25, 50] as const;
export const DEFAULT_SEARCH_RADIUS_MILES = 10;
export const MAX_SEARCH_RADIUS_MILES = 100;

const EARTH_RADIUS_MILES = 3958.8;
const MILES_PER_DEGREE_LAT = (Math.PI / 180) * EARTH_RADIUS_MILES;

const toRadians = (deg: number): number => (deg * Math.PI) / 180;

/** Great-circle (haversine) distance between two points. */
export const distanceMiles = (a: LatLng, b: LatLng): number => {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
};

/*
 * Shortest distance from `point` to the segment `from`-`to`. Projects onto a flat plane centred on
 * the point, which is accurate to well under a mile at regional distances.
 */
export const distanceToSegmentMiles = (point: LatLng, from: LatLng, to: LatLng): number => {
  const milesPerDegreeLng = MILES_PER_DEGREE_LAT * Math.cos(toRadians(point.lat));
  const project = (p: LatLng) => ({
    x: (p.lng - point.lng) * milesPerDegreeLng,
    y: (p.lat - point.lat) * MILES_PER_DEGREE_LAT,
  });

  const a = project(from);
  const b = project(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;

  // How far along the segment the closest point sits, clamped to the endpoints
  const t =
    lengthSquared === 0 ? 0 : Math.min(1, Math.max(0, -(a.x * dx + a.y * dy) / lengthSquared));

  return Math.hypot(a.x + t * dx, a.y + t * dy);
};

/** Lat/lng box around a point that contains every spot within `radiusMiles` (ignores the poles). */
export const boundingBox = (
  center: LatLng,
  radiusMiles: number,
): { minLat: number; maxLat: number; minLng: number; maxLng: number } => {
  const dLat = radiusMiles / MILES_PER_DEGREE_LAT;
  const dLng = dLat / Math.max(0.01, Math.cos(toRadians(center.lat)));

  return {
    minLat: center.lat - dLat,
    maxLat: center.lat + dLat,
    minLng: center.lng - dLng,
    maxLng: center.lng + dLng,
  };
};
