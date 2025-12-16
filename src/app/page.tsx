'use client';

import { useState } from 'react';

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

import type { JSX } from 'react';

/*
    <div>
      <div className="font-sans grid grid-rows[20px_1fr_20px] items-center justify-items-center p-8 pb-20 gap-16 sm:p-20">
        <form className="flex flex-col justify-items-center items-center gap-4">
          <div className="flex gap-1 justify-items-center items-center">
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
          <input
            className="max-w-30 rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            id="post"
            name="post"
            type="submit"
            value="Create a Post"
            onClick={(event) => {
              event?.preventDefault();
              setOpen(true);
            }}
          />
        </form>
    </div>*/

const Home = (): JSX.Element => {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Dialog>
        <form>
          <div>
            <div className="flex gap-1 justify-items-center items-center">
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
            <DialogTrigger asChild>
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
      <main>{/* Bento-style grid of posts */}</main>
    </div>
  );
};

export default Home;
