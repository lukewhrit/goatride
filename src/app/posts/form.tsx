import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

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
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { Textarea } from '@/components/ui/textarea';
import { errorMessage, unwrap } from '@/lib/actionResult';
import { publishPostSchema } from '@/lib/validation';

import { publishPost } from '../../lib/posts';

import type { JSX } from 'react';
// eslint-disable-next-line import-x/no-namespace
import type * as z from 'zod';

const PostRideForm = (): JSX.Element => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(publishPostSchema),
    defaultValues: {
      origin: '',
      destination: '',
      departureDate: '',
      seatsAvailable: '1',
      seatPrice: '0.0',
      comments: 'N/A',
    },
  });

  async function onSubmit(data: z.infer<typeof publishPostSchema>) {
    try {
      const post = await unwrap(publishPost(data));

      setOpen(false);
      // New URL → the server page re-renders with the new post first in the list
      router.push(`/posts?highlight=${post.id}`);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not share your ride. Please try again later.'));
    }
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild className="max-w-sm">
        <Button variant="outline">Share Ride</Button>
      </DialogTrigger>
      <form
        className="w-full xl:w-4xl px-5 flex items-center1 justify-center"
        id="create-post-form"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Share a Ride</DialogTitle>
            <DialogDescription>
              Enter your information here to post a ride. Click post when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="grid gap-3">
            {/* Origin */}
            <Controller
              control={form.control}
              name="origin"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="origin">Origin</FieldLabel>
                  <Input
                    {...field}
                    id="origin"
                    name="origin"
                    placeholder="Worcester, MA"
                    type="text"
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="destination"
              render={({ field, fieldState }) => (
                <Field className="grid gap-3">
                  <FieldLabel htmlFor="destination">Destination</FieldLabel>
                  <Input
                    {...field}
                    id="destination"
                    name="destination"
                    placeholder="Boston, MA"
                    type="text"
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="departureDate"
              render={({ field, fieldState }) => (
                <Field className="grid gap-3">
                  <FieldLabel>Departing at</FieldLabel>
                  <Input {...field} id="departure" name="departure" type="date" />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <FieldGroup className="grid grid-cols-2 gap-3">
              <Controller
                control={form.control}
                name="seatsAvailable"
                render={({ field, fieldState }) => (
                  <Field className="grid gap-3">
                    <FieldLabel htmlFor="seats">Seats available</FieldLabel>
                    <Input {...field} id="seats" max={8} min={1} name="seats" type="number" />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="seatPrice"
                render={({ field, fieldState }) => (
                  <Field className="grid gap-3">
                    <FieldLabel htmlFor="seat-price">Price per seat (optional)</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>$</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        {...field}
                        /* Hide up/down button */
                        className="[appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
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
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>
            <Controller
              control={form.control}
              name="comments"
              render={({ field, fieldState }) => (
                <Field className="grid gap-3">
                  <FieldLabel htmlFor="comments">Comments (optional)</FieldLabel>
                  <Textarea {...field} id="comments" name="comments" />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button form="create-post-form" type="submit">
              Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
};

export const dynamic = 'force-dynamic';

export default PostRideForm;
