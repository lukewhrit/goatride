'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from '@/lib/auth-client';

import type { JSX } from 'react';

const DashboardPage = (): JSX.Element => {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in');
    }
  }, [isPending, session, router]);

  if (isPending) return <p className="text-center mt-8 text-white">Loading...</p>;
  if (!session?.user) return <p className="text-center mt-8 text-white">Redirecting...</p>;

  // const { user } = session;

  return (
    <div>
      <header className="flex flex-col items-center justify-items-center">
        <Dialog>
          <form>
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1 items-center">
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="font-sans font-extrabold text-5xl" htmlFor="location">
                  <h1>I&apos;m going to</h1>
                </label>
                <input
                  className="max-w-lg border-b-2 ml-1 text-5xl outline-white py-1.5 pr-3 pl-1 text-white placeholder:text-gray-500 focus:outline-none"
                  id="location"
                  name="location"
                  placeholder="Union Station..."
                  type="text"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="default">Find a Ride</Button>
                <DialogTrigger asChild className="max-w-sm">
                  <Button variant="outline">Create Post</Button>
                </DialogTrigger>
              </div>
            </div>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create a Post</DialogTitle>
                <DialogDescription>
                  Enter your information here to post a ride. Click post when you&apos;re done.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="origin">Origin</Label>
                  <Input readOnly defaultValue="Worcester, MA" id="origin" name="origin" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    defaultValue={(document.getElementById('location') as HTMLFormElement)?.value}
                    id="destination"
                    name="destination"
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="username-1">Departing at</Label>
                  <Input
                    defaultValue={new Date().toISOString()}
                    id="departure"
                    name="departure"
                    type="datetime-local"
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="seats">Seats available</Label>
                  <Input defaultValue={1} id="seats" max={8} min={1} name="seats" type="number" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="comments">Comments</Label>
                  <Textarea id="comments" name="comments" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Post</Button>
              </DialogFooter>
            </DialogContent>
          </form>
        </Dialog>
      </header>
      <main>{/* Bento-style grid of posts */}</main>
    </div>
  );
};

export default DashboardPage;
