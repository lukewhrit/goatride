'use server';
// import { usePlacesAutocomplete } from 'places-autocomplete-hook';

// const places = usePlacesAutocomplete({
//   apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
// });

// export default places;

import { Client, PlaceType2 } from '@googlemaps/google-maps-services-js';

import type { LatLngLiteral } from '@googlemaps/google-maps-services-js';

const client = new Client({});

export async function fake(): Promise<number> {
  return 0;
}

export async function geocode(unformatted: string): Promise<LatLngLiteral> {
  const res = await client.geocode({
    params: {
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
      address: unformatted,
    },
  });

  return res.data.results[0].geometry.location;
}

export async function ungeocode(lat: number, lng: number): Promise<string> {
  const res = await client.reverseGeocode({
    params: {
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
      latlng: { lat, lng },
    },
  });

  const ac = res.data.results[0]?.address_components;

  const town = ac?.find((e) => e.types.includes(PlaceType2.locality));
  const state = ac?.find((e) => e.types.includes(PlaceType2.administrative_area_level_1));

  return `${town?.short_name}, ${state?.short_name}`;
}
