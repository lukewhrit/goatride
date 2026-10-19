'use client';

import { ArrowRightIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
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
import { getOrCreateConversation } from '@/lib/messages';
import { cn } from '@/lib/utils';

import PostRideForm from './form';
import AddressSearch from '../ui/placeSearch';

import type { JSX } from 'react';

import type { RidePostListItem } from '@/lib/posts';

interface PostsViewProps {
  posts: RidePostListItem[];
  currentPage: number;
  totalPages: number;
  currentUserId: string;
}

const PostsView = ({
  posts,
  currentPage,
  totalPages,
  currentUserId,
}: PostsViewProps): JSX.Element => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageWindow = 5; // how many page numbers are displayed at once
  const highlight = searchParams.get('highlight') ?? '';

  // Update the URL without a server round-trip; Next keeps useSearchParams in sync with history
  const highlightPost = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('highlight', id);
    window.history.replaceState(null, '', `?${params.toString()}`);
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
          <div className="flex gap-3 lg:items-center lg:justify-center max-w-lg">
            <AddressSearch className="w-xs" />
            <Button variant="default">Search</Button>
            <PostRideForm />
          </div>
        </div>
      </header>
      <main className="my-5 px-10">
        {posts.length === 0 && <p className="text-center">No rides yet. Share one!</p>}
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
                        const conversationId = await getOrCreateConversation(
                          ride.creator.id,
                          ride.id,
                        );
                        router.push(`/messages?conversation=${conversationId}`);
                      } catch (err) {
                        toast.error(
                          err instanceof Error ? err.message : 'Could not open conversation',
                        );
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
              <PaginationPrevious href={`?page=${Math.max(1, currentPage - 1)}`} />
            </PaginationItem>
          )}
          {pageNumbers.map((v) => (
            <PaginationItem key={v}>
              <PaginationLink href={`?page=${v}`} isActive={v === currentPage}>
                {v}
              </PaginationLink>
            </PaginationItem>
          ))}
          {currentPage !== pageNumbers[pageNumbers.length - 1] && (
            <PaginationItem>
              <PaginationNext href={`?page=${currentPage + 1}`} />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default PostsView;
