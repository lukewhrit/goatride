'use client';

import { useRef, useState } from 'react';

import { ArrowRightIcon, MapPinIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { errorMessage, unwrap } from '@/lib/actionResult';
import { DEFAULT_SEARCH_RADIUS_MILES, SEARCH_RADII_MILES } from '@/lib/distance';
import { geocode } from '@/lib/maps';
import { getOrCreateConversation } from '@/lib/messages';
import { cn } from '@/lib/utils';

import PostRideForm from './form';
import AddressSearch from '../ui/placeSearch';

import type { JSX } from 'react';

import type { RidePostListItem } from '@/lib/posts';

import type { AddressSearchHandle, SelectedPlace } from '../ui/placeSearch';

/** The active search, as read from the URL by the page. */
export interface RideSearch {
  label: string;
  lat: number;
  lng: number;
  radiusMiles: number;
}

interface PostsViewProps {
  posts: RidePostListItem[];
  currentPage: number;
  totalPages: number;
  currentUserId: string;
  search?: RideSearch;
}

/** How far a ride's route strays from the searched place, as a short badge label. */
const offRouteLabel = (miles: number): string =>
  miles < 1 ? 'On the way' : `${Math.round(miles)} mi off route`;

const PostsView = ({
  posts,
  currentPage,
  totalPages,
  currentUserId,
  search,
}: PostsViewProps): JSX.Element => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(search?.label ?? '');
  // Cleared whenever the text changes, so a stale pick never searches the wrong place
  const [place, setPlace] = useState<SelectedPlace | null>(null);
  const [radius, setRadius] = useState(String(search?.radiusMiles ?? DEFAULT_SEARCH_RADIUS_MILES));
  const [searching, setSearching] = useState(false);
  const searchBox = useRef<AddressSearchHandle>(null);
  const pageWindow = 5; // how many page numbers are displayed at once
  const highlight = searchParams.get('highlight') ?? '';

  // Update the URL without a server round-trip; Next keeps useSearchParams in sync with history
  const highlightPost = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('highlight', id);
    window.history.replaceState(null, '', `?${params.toString()}`);
  };

  const runSearch = async () => {
    if (!query.trim()) {
      router.push('/posts');
      return;
    }

    setSearching(true);
    try {
      /*
       * Typed text without a pick takes the top suggestion, which closes the autocomplete session
       * so those keystrokes aren't billed. Only text Google offered nothing for goes to the
       * server, which checks known towns before falling back to Geocoding.
       */
      const target = place ??
        (await searchBox.current?.pickTopSuggestion()) ?? {
          ...(await geocode(query)),
          label: '',
        };
      const params = new URLSearchParams({
        to: target.label || target.name,
        lat: String(target.lat),
        lng: String(target.lng),
        radius,
      });
      router.push(`/posts?${params.toString()}`);
    } catch (err) {
      toast.error(errorMessage(err, `Could not find "${query}"`));
    } finally {
      setSearching(false);
    }
  };

  // Pagination keeps the active search
  const pageHref = (n: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(n));
    params.delete('highlight');
    return `?${params.toString()}`;
  };

  const pageNumbers = (() => {
    const half = Math.floor(pageWindow / 2);

    let start = Math.max(1, currentPage - half);
    const end = Math.min(totalPages, start + pageWindow - 1);

    // shift window if we're near the end
    if (end - start + 1 < pageWindow) {
      start = Math.max(1, end - pageWindow + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  return (
    <div>
      <header>
        <div className="flex flex-col items-center justify-center gap-3 w-full">
          <h1 className="font-sans font-extrabold text-4xl">Where are you going?</h1>
          <div className="flex gap-3 lg:items-center lg:justify-center max-w-2xl">
            <form
              className="contents"
              onSubmit={async (e) => {
                e.preventDefault();
                await runSearch();
              }}
            >
              <AddressSearch
                aria-label="Where are you going?"
                className="w-xs"
                defaultValue={search?.label}
                onPlaceSelect={setPlace}
                searchRef={searchBox}
                endAdornment={
                  <Select onValueChange={setRadius} value={radius}>
                    <SelectTrigger
                      aria-label="Search radius"
                      className="h-7 shrink-0 gap-1 rounded-none border-0 border-l bg-transparent pr-0 pl-3 text-muted-foreground shadow-none focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent hover:cursor-pointer"
                      size="sm"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      {SEARCH_RADII_MILES.map((miles) => (
                        <SelectItem
                          key={miles}
                          className="hover:cursor-pointer"
                          value={String(miles)}
                        >
                          {miles} mi
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
                onQueryChange={(value) => {
                  setQuery(value);
                  setPlace(null);
                }}
              />
              <Button disabled={searching} type="submit" variant="default">
                {searching ? 'Searching…' : 'Search'}
              </Button>
            </form>
            <PostRideForm />
          </div>
          {search !== undefined && (
            <p className="text-sm text-neutral-500">
              Rides passing within {search.radiusMiles} mi of {search.label || 'that place'} ·{' '}
              <Link className="underline" href="/posts">
                Clear search
              </Link>
            </p>
          )}
        </div>
      </header>
      <main className="my-5 px-10">
        {posts.length === 0 && (
          <p className="text-center">
            {search
              ? 'No rides pass near there yet. Try a wider radius, or share one!'
              : 'No rides yet. Share one!'}
          </p>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {posts.map((ride) => (
            <Dialog key={ride.id}>
              <DialogTrigger asChild>
                <Card
                  onClick={() => highlightPost(ride.id)}
                  className={cn(
                    'flex flex-col',
                    'transition hover:outline-2 hover:outline-blue-500',
                    ride.id === highlight
                      ? 'outline-2 outline-blue-500 shadow-blue-500/50 shadow-lg'
                      : '',
                  )}
                >
                  <CardHeader>
                    <CardTitle>
                      {ride.origin} to {ride.destination}
                    </CardTitle>
                    <CardDescription>Posted by {ride.creator.name}</CardDescription>
                    {ride.distanceMiles !== undefined && (
                      <Badge
                        title={`Route passes about ${ride.distanceMiles.toFixed(1)} mi from ${search?.label ?? 'your search'}`}
                        variant="secondary"
                      >
                        <MapPinIcon />
                        {offRouteLabel(ride.distanceMiles)}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-400">
                      {format(new Date(ride.departureTime), 'EEE, MMM d · h:mm a')} ·{' '}
                      {ride.seatsAvailable - ride.seatsTaken} of {ride.seatsAvailable} seat
                      {ride.seatsAvailable === 1 ? '' : 's'} left
                      {ride.price === '0' ? ' · Free' : ` · $${ride.price}/seat`}
                      {ride.status === 'OPEN' ? '' : ` · ${ride.status.toLowerCase()}`}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant="outline">
                      View Post
                    </Button>
                  </CardFooter>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ride shared by {ride.creator.name}</DialogTitle>
                  <DialogDescription className="flex gap-2 items-center">
                    <Badge className={`badge-${ride.status.toString().toLowerCase()}`}>
                      {ride.status.toString()}
                    </Badge>
                    Last updated on {(ride.lastEditedAt ?? ride.createdAt).toDateString()}
                  </DialogDescription>
                </DialogHeader>
                <section className="flex flex-col gap-3">
                  <section className="bg-neutral-50 dark:bg-neutral-900 p-3 rounded-md border">
                    <div className="flex gap-3 justify-center items-center font-bold text-xl text-black dark:text-white">
                      <span>{ride.origin}</span>
                      <ArrowRightIcon className="text-center h-4" />
                      <span>{ride.destination}</span>
                    </div>
                  </section>

                  <div className="grid grid-cols-2">
                    <section>
                      <h2 className="text-md font-bold mb-0.5">Seats Available</h2>
                      <p>
                        {ride.seatsAvailable - ride.seatsTaken} of {ride.seatsAvailable} seat
                        {ride.seatsAvailable === 1 ? '' : 's'} left
                        {ride.price !== '0' ? <span> at ${ride.price} per seat</span> : ''}.
                      </p>
                    </section>
                    <section>
                      <h2 className="text-md font-bold mb-0.5">Departure Date</h2>
                      <div>
                        {ride.departureTime.toLocaleTimeString()} on{' '}
                        {ride.departureTime.toLocaleDateString()}
                      </div>
                    </section>
                  </div>

                  <section>
                    <h2 className="text-md font-bold mb-0.5">Notes</h2>
                    <p>{ride.notes}</p>
                  </section>
                </section>
                <DialogFooter>
                  <Button
                    disabled={ride.creator.id === currentUserId}
                    onClick={async () => {
                      try {
                        const conversationId = await unwrap(
                          getOrCreateConversation(ride.creator.id, ride.id),
                        );
                        router.push(`/messages?conversation=${conversationId}`);
                      } catch (err) {
                        toast.error(errorMessage(err, 'Could not open conversation'));
                      }
                    }}
                  >
                    Send a message
                  </Button>
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </main>
      <Pagination className="mb-5">
        <PaginationContent>
          {currentPage !== 1 && (
            <PaginationItem>
              <PaginationPrevious href={pageHref(Math.max(1, currentPage - 1))} />
            </PaginationItem>
          )}
          {pageNumbers.map((v) => (
            <PaginationItem key={v}>
              <PaginationLink href={pageHref(v)} isActive={v === currentPage}>
                {v}
              </PaginationLink>
            </PaginationItem>
          ))}
          {currentPage !== pageNumbers[pageNumbers.length - 1] && (
            <PaginationItem>
              <PaginationNext href={pageHref(currentPage + 1)} />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default PostsView;
