'use client';

import React, { useEffect, useImperativeHandle, useMemo, useState } from 'react';

import { usePlacesAutocomplete } from 'places-autocomplete-hook';

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatPlaceName } from '@/lib/placeName';

import type { JSX } from 'react';

import type { GeocodedPlace } from '@/lib/geocoding';

export interface SelectedPlace extends GeocodedPlace {
  /** The suggestion text the user picked, e.g. "Boston, MA, USA". */
  label: string;
}

interface AddressSearchProps extends Omit<React.ComponentProps<'input'>, 'defaultValue'> {
  defaultValue?: string;
  /** Rendered inside the box, after the text (e.g. a radius picker). */
  endAdornment?: React.ReactNode;
  /** Called with the typed text on every change, before any suggestion is picked. */
  onQueryChange?: (query: string) => void;
  /** Called once a picked suggestion's coordinates have been looked up. */
  onPlaceSelect?: (place: SelectedPlace) => void;
  /** Lets a parent form resolve typed-but-unpicked text without another Google API. */
  searchRef?: React.Ref<AddressSearchHandle>;
}

export interface AddressSearchHandle {
  /** Picks the top suggestion as if clicked; null when there are none. */
  pickTopSuggestion: () => Promise<SelectedPlace | null>;
}

interface PlaceDetailsResult {
  location?: { latitude: number; longitude: number };
  addressComponents?: { shortText: string; types: string[] }[];
}

const newSessionToken = (): string => crypto.randomUUID();

const AddressSearch = ({
  defaultValue = '',
  endAdornment,
  onQueryChange,
  onPlaceSelect,
  searchRef,
  ...props
}: AddressSearchProps): JSX.Element => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(defaultValue);
  /*
   * Google bills the autocomplete requests and the Place Details call that ends them as one
   * session when they share a token, instead of charging every keystroke. A pick ends the
   * session, so the next one starts with a fresh token.
   */
  const [sessionToken, setSessionToken] = useState(newSessionToken);

  const { suggestions, setValue, clearSuggestions, loading, error, getPlaceDetails } =
    usePlacesAutocomplete({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
      includedPrimaryTypes: ['locality'],
      includedRegionCodes: ['US'],
      sessionToken,
    });

  const items = useMemo(() => {
    if (suggestions.status !== 'OK') return [];

    return suggestions.data.map((prediction) => {
      const main = prediction.structuredFormat?.mainText?.text ?? '';
      const secondary = prediction.structuredFormat?.secondaryText?.text ?? '';
      const label = [main, secondary].filter(Boolean).join(', ');

      return {
        id: prediction.placeId,
        label,
      };
    });
  }, [suggestions]);

  useEffect(() => {
    setOpen(items.length > 0);
  }, [items.length]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setValue(value);
    onQueryChange?.(value);

    if (!value.trim()) {
      clearSuggestions();
      setOpen(false);
    }
  };

  const handleSelect = async (placeId: string, label: string): Promise<SelectedPlace | null> => {
    setInputValue(label);
    // Don't search again for the picked text
    setValue(label, false);

    setOpen(false);
    clearSuggestions();

    try {
      // Only Essentials fields, the cheapest Place Details tier; the hook's default asks for more
      const details = (await getPlaceDetails(placeId, [
        'location',
        'addressComponents',
      ])) as PlaceDetailsResult;
      if (!details.location) return null;

      const place = {
        lat: details.location.latitude,
        lng: details.location.longitude,
        name: formatPlaceName(
          details.addressComponents?.map((c) => ({ short: c.shortText, types: c.types })),
        ),
        label,
      };
      onPlaceSelect?.(place);
      return place;
    } catch {
      // Nothing picked as far as the parent knows; it can still look up the typed text itself
      return null;
    } finally {
      setSessionToken(newSessionToken());
    }
  };

  useImperativeHandle(searchRef, () => ({
    pickTopSuggestion: async () => (items[0] ? handleSelect(items[0].id, items[0].label) : null),
  }));

  return (
    <div className="w-full 2xl:w-lg 2xl:max-w-lg">
      <Popover onOpenChange={setOpen} open={open}>
        <Command className="w-full border border-b-0" shouldFilter={false}>
          <PopoverTrigger asChild>
            <CommandInput
              {...props}
              endAdornment={endAdornment}
              onValueChange={handleInputChange}
              placeholder="Enter a town or city"
              value={inputValue}
              onFocus={() => {
                if (items.length > 0) setOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setOpen(false);
                  clearSuggestions();
                }
                // cmdk swallows Enter to pick a suggestion; with none showing, submit the form
                if (e.key === 'Enter' && !open) e.currentTarget.form?.requestSubmit();
              }}
            />
          </PopoverTrigger>

          <PopoverContent
            align="start"
            className="w-(--radix-popover-trigger-width) max-w-none p-0"
            onOpenAutoFocus={(e) => e.preventDefault()}
            side="bottom"
          >
            <CommandList>
              <CommandEmpty>{!loading && !error ? 'No results' : null}</CommandEmpty>

              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={async () => handleSelect(item.id, item.label)}
                  value={item.label}
                >
                  {item.label}
                </CommandItem>
              ))}
            </CommandList>
          </PopoverContent>
        </Command>
      </Popover>
    </div>
  );
};

export default AddressSearch;
