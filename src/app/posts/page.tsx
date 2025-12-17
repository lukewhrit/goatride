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
              <DialogTrigger asChild className="max-w-sm">
                <Button variant="outline">Create Post</Button>
              </DialogTrigger>
            </div>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
                <DialogDescription>
                  Make changes to your profile here. Click save when you&apos;re done.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="name-1">Name</Label>
                  <Input defaultValue="Pedro Duarte" id="name-1" name="name" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="username-1">Username</Label>
                  <Input defaultValue="@peduarte" id="username-1" name="username" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save changes</Button>
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
