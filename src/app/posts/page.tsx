'use client';

import { useEffect } from 'react';

import { ChevronDownIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { redirect, useRouter } from 'next/navigation';

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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RideStatus } from '@/generated/prisma/enums';
import { useSession } from '@/lib/auth-client';
import prisma from '@/lib/prisma';

import type { JSX } from 'react';

const publishPost = async (
  user: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null | undefined;
  },
  formData: FormData,
) => {
  const post = await prisma.ridePost.create({
    data: {
      // creator: user,

      originLat: 42.2741,
      originLng: 71.808,
      destinationLat: 0,
      destinationLng: 0,

      departureTime: new Date(),
      seatsAvailable: formData.get('seats') as unknown as number,
      seatsTaken: 0,

      notes: formData.get('comments') as string,
      price: formData.get('price') as unknown as number,

      status: RideStatus.OPEN,
    },
  });

  redirect(`/posts?highlight=${post.id}`);
};

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

  const { user } = session;

  return (
    <div>
      <header className="flex flex-col items-center justify-items-center">
        <Dialog>
          <form action={async (formData) => publishPost(user, formData)}>
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
              <div className="grid gap-3">
                <Label htmlFor="origin">Origin</Label>
                <InputGroup>
                  <InputGroupInput
                    disabled
                    readOnly
                    defaultValue="Worcester, MA"
                    id="origin"
                    name="origin"
                  />
                  <InputGroupAddon align="inline-end">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InputGroupButton aria-label="Help" size="icon-xs" variant="ghost">
                          <InformationCircleIcon />
                        </InputGroupButton>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Different origin locations are not currently available.</p>
                      </TooltipContent>
                    </Tooltip>
                  </InputGroupAddon>
                </InputGroup>
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-3">
                    <Label htmlFor="seats">Seats available</Label>
                    <Input defaultValue={1} id="seats" max={8} min={1} name="seats" type="number" />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="seat-price">Price per seat (optional)</Label>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>$</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        /* Hide up/down button */
                        className="[appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                        defaultValue="0.00"
                        id="seat-price"
                        max={9999.99}
                        min={0.0}
                        name="seat-price"
                        placeholder="0.00"
                        type="number"
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText>USD</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="contact-method">Contact Method</Label>
                  <div className="grid grid-cols-6 gap-3">
                    <Input
                      className="col-span-4"
                      id="contact-method"
                      name="contact-method"
                      placeholder="@lwhrit"
                    />
                    <div className="col-span-2">
                      <Select>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Method" />
                        </SelectTrigger>
                        <SelectContent align="end" className="[--radius:0.95rem]">
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="comments">Comments (optional)</Label>
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
