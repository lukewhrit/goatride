import { describe, expect, it } from 'vitest';

import { boundingBox, distanceMiles, distanceToSegmentMiles } from '@/lib/distance';

const worcester = { lat: 42.2626, lng: -71.8023 };
const boston = { lat: 42.3601, lng: -71.0589 };
const framingham = { lat: 42.2793, lng: -71.4162 };
const providence = { lat: 41.824, lng: -71.4128 };

describe('distanceMiles', () => {
  it('measures great-circle distance', () => {
    expect(distanceMiles(worcester, boston)).toBeCloseTo(38.6, 0);
    expect(distanceMiles(boston, boston)).toBe(0);
  });
});

describe('distanceToSegmentMiles', () => {
  it('is near zero for a town on the way', () => {
    expect(distanceToSegmentMiles(framingham, worcester, boston)).toBeLessThan(5);
  });

  it('measures to the nearest endpoint past the end of the route', () => {
    const past = distanceToSegmentMiles(providence, boston, framingham);
    expect(past).toBeCloseTo(distanceMiles(providence, framingham), 0);
  });

  it('is far for a town off the route', () => {
    expect(distanceToSegmentMiles(providence, worcester, boston)).toBeGreaterThan(25);
  });

  it('handles a zero-length route', () => {
    expect(distanceToSegmentMiles(boston, worcester, worcester)).toBeCloseTo(
      distanceMiles(boston, worcester),
      0,
    );
  });
});

describe('boundingBox', () => {
  it('contains every point within the radius', () => {
    const box = boundingBox(worcester, 40);
    expect(box.minLat).toBeLessThan(boston.lat);
    expect(box.maxLat).toBeGreaterThan(boston.lat);
    expect(box.minLng).toBeLessThan(boston.lng);
    expect(box.maxLng).toBeGreaterThan(boston.lng);
  });

  it('excludes points well outside it', () => {
    const box = boundingBox(worcester, 10);
    expect(boston.lng).toBeGreaterThan(box.maxLng);
  });
});
