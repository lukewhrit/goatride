'use client';

import React, { useEffect, useMemo, useState } from 'react';

import { usePlacesAutocomplete } from 'places-autocomplete-hook';

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { InputGroup, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { geocode } from '@/lib/maps';

import type { JSX } from 'react';

const AddressSearch = (props: React.ComponentProps<'input'>): JSX.Element => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const {
    suggestions,
    setValue,
    clearSuggestions,
    loading,
    error,
    getPlaceDetails,
    handlePlaceSelect,
  } = usePlacesAutocomplete({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    includedPrimaryTypes: ['locality'],
    includedRegionCodes: ['US'],
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

    if (!value.trim()) {
      clearSuggestions();
      setOpen(false);
    }
  };

  const handleSelect = async (placeId: string, label: string) => {
    setInputValue(label);
    setValue(label);

    setOpen(false);
    clearSuggestions();

    await handlePlaceSelect(placeId);
    const details = await getPlaceDetails(placeId);
    const result = await geocode(details.formattedAddress);

    return result;
  };

  return (
    <div className="w-full 2xl:w-lg 2xl:max-w-lg">
      <Popover onOpenChange={setOpen} open={open}>
        <Command className="w-full border-1 border-b-0" shouldFilter={false}>
          <PopoverTrigger asChild>
            <CommandInput
              {...props}
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
              }}
            />
          </PopoverTrigger>

          <PopoverContent
            align="start"
            className="w-[var(--radix-popover-trigger-width)] max-w-none p-0"
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
