'use client';

import { useEffect, useState } from 'react';

import { ArrowRightIcon } from '@heroicons/react/24/solid';
import { Item } from '@radix-ui/react-navigation-menu';
import { useRouter, useSearchParams } from 'next/navigation';

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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useSession } from '@/lib/auth-client';
import { ungeocode } from '@/lib/maps';

import { fetchPosts } from './actions';
import PostRideForm from './form';

import type { JSX } from 'react';

import type { RidePostPriceString, User } from './actions';

interface PostDisplay extends Omit<RidePostPriceString, 'destinationLat' | 'destinationLng'> {
  creator: User;
  price: string;
  origin: string;
  destination: string;
}

const DashboardPage = (): JSX.Element => {
  const router = useRouter();
  const [posts, setPosts] = useState<PostDisplay[]>();
  const { data: session, isPending } = useSession();
  const searchParams = useSearchParams();
  const pageNumbers = [1, 2, 3, 4, 5];
  const currentPage = searchParams.get('page') ?? pageNumbers[0];

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in');
    }
  }, [isPending, session, router]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      const p = await fetchPosts();

      const enriched = await Promise.all(
        p.map(async (post) => {
          try {
            const destination =
              post.destinationLat != null && post.destinationLng != null
                ? await ungeocode(post.destinationLat, post.destinationLng)
                : 'Unknown destination';

            return { ...post, origin: 'Worcester, MA', destination };
          } catch (e) {
            return { ...post, origin: 'Worcester, MA', destination: 'Unknown destination' };
          }
        }),
      );

      if (!cancelled) setPosts(enriched);
    }

    fetchData().catch((e) => console.error(e));

    return () => {
      cancelled = true;
    };
  }, []);

  if (isPending) return <p className="text-center mt-8 text-white">Loading...</p>;
  if (!session?.user) return <p className="text-center mt-8 text-white">Redirecting...</p>;

  return (
    <div>
      <header className="flex flex-col items-center justify-items-center">
        <PostRideForm user={session.user} />
      </header>
      <main className="my-5 px-10">
        <div className="grid grid-cols-4 gap-3">
          {posts?.map((item) => (
            <Dialog key={item.id}>
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>
                    {item.origin} to {item.destination}
                  </CardTitle>
                  <CardDescription className="flex-1">
                    Posted by {item.creator.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  {/* Seats: {item.seatsAvailable}/${item.price} */}
                  {item.departureTime.toDateString()}
                </CardContent>
                <CardFooter>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      View Post
                    </Button>
                  </DialogTrigger>
                </CardFooter>
              </Card>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ride shared by {item.creator.name}</DialogTitle>
                  <DialogDescription className="flex gap-2 items-center">
                    <Badge className={`badge-${item.status.toString().toLowerCase()}`}>
                      {item.status.toString()}
                    </Badge>
                    Last updated on {(item.lastEditedAt ?? item.createdAt).toDateString()}
                  </DialogDescription>
                </DialogHeader>
                <section className="flex flex-col gap-3">
                  <section className="bg-neutral-900 p-3 rounded-md border">
                    <div className="flex gap-3 justify-center items-center font-bold text-xl">
                      <span>{item.origin}</span>
                      <ArrowRightIcon className="text-center h-4" />
                      <span>{item.destination}</span>
                    </div>
                  </section>

                  <div className="grid grid-cols-2">
                    <section>
                      <h2 className="text-md font-bold mb-0.5">Seats Available</h2>
                      <p>
                        {item.seatsAvailable} seat
                        {item.seatsAvailable === 1 ? '' : 's'} available
                        {item.price !== '0' ? <span> at ${item.price} per seat</span> : ''}.
                      </p>
                    </section>
                    <section>
                      <h2 className="text-md font-bold mb-0.5">Departure Date</h2>
                      <div>
                        {item.departureTime.toLocaleTimeString()} on{' '}
                        {item.departureTime.toLocaleDateString()}
                      </div>
                    </section>
                  </div>

                  <section>
                    <h2 className="text-md font-bold mb-0.5">Notes</h2>
                    <p>{item.notes}</p>
                  </section>
                </section>
                <DialogFooter>
                  <Button>Send a message</Button>
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
          <PaginationItem>
            <PaginationPrevious href={`?page=${currentPage === 1 ? 1 : Number(currentPage) - 1}`} />
          </PaginationItem>
          {pageNumbers.map((v) => (
            <PaginationItem key={v}>
              <PaginationLink href={`?page=${v}`}>{v}</PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext href={`?page=${Number(currentPage) + 1}`} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default DashboardPage;
