/*
 * Shared by the server's Geocoding results and the browser's Place Details results, so a place
 * gets the same "Worcester, MA" name whichever Google API resolved it.
 */

export const UNKNOWN_PLACE = 'Unknown location';

export interface PlaceComponent {
  /** Short form, e.g. "MA" for Massachusetts. */
  short: string;
  types: string[];
}

export const formatPlaceName = (components: PlaceComponent[] | undefined): string => {
  const town = components?.find((e) => e.types.includes('locality'));
  const state = components?.find((e) => e.types.includes('administrative_area_level_1'));

  return [town?.short, state?.short].filter(Boolean).join(', ') || UNKNOWN_PLACE;
};
