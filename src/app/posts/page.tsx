'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useSession } from '@/lib/auth-client';

import { fetchPosts } from './actions';
import PostRideForm from './form';

import type { JSX } from 'react';

import type { RidePostPriceString } from './actions';

const DashboardPage = (): JSX.Element => {
  const router = useRouter();
  const [posts, setPosts] = useState<RidePostPriceString[]>();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in');
    }
  }, [isPending, session, router]);

  useEffect(() => {
    fetchPosts()
      .then((p) => {
        setPosts(p);
      })
      .catch(console.error);
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
              <Card>
                <CardHeader>
                  <CardTitle>
                    {item.creator.name} is heading from {item.originLat}
                    {item.originLng} to {item.destinationLat}
                    {item.destinationLng} on {item.departureTime.toDateString()}
                  </CardTitle>
                  <CardDescription>
                    Seats: {item.seatsAvailable}
                    Price: {item.price}
                  </CardDescription>
                  <CardFooter>
                    <DialogTrigger asChild>
                      <Button className="w-full" variant="outline">
                        View Post
                      </Button>
                    </DialogTrigger>
                  </CardFooter>
                </CardHeader>
              </Card>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ride shared by {item.creator.name}</DialogTitle>
                  <DialogDescription className="flex gap-2 items-center">
                    <Badge>{item.status.toString()}</Badge>
                    Posted on {item.createdAt.toDateString()}
                  </DialogDescription>
                </DialogHeader>
                <p>
                  {item.creator.name.split(' ')[0]} is heading from <strong>Worcester, MA</strong>{' '}
                  to <strong>Fair Lawn, NJ</strong>. They are leaving at{' '}
                  <strong>{item.departureTime.toLocaleTimeString()}</strong> on{' '}
                  <strong>{item.departureTime.toLocaleDateString()}</strong>. They have{' '}
                  <strong>
                    {item.seatsAvailable} seat
                    {item.seatsAvailable === 1 ? '' : 's'} available{' '}
                  </strong>
                  {item.price !== '0' ? (
                    <span>
                      and are asking <strong>${item.price} per seat</strong>
                    </span>
                  ) : (
                    ''
                  )}
                  .
                </p>
                <p>Contact</p>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
