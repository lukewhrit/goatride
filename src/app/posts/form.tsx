import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
// eslint-disable-next-line import-x/no-namespace
import * as z from 'zod';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ContactPlatforms } from '@/generated/prisma/enums';

import { publishPost } from '../../lib/posts';

import type { JSX } from 'react';

import type { User } from '../../lib/posts';

const formSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  departureDate: z.string(),
  seatsAvailable: z.coerce.number<string>().min(1),
  seatPrice: z.coerce.number<string>().min(0.0),
  contactMethod: z.string(),
  contactMethodType: z.enum(ContactPlatforms),
  comments: z.string(),
});

const PostRideForm = ({ user }: { user: User }): JSX.Element => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origin: '',
      destination: '',
      departureDate: '',
      seatsAvailable: '1',
      seatPrice: '0.0',
      contactMethod: '',
      contactMethodType: ContactPlatforms.INSTAGRAM,
      comments: 'N/A',
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      const post = await publishPost(user, data);

      setOpen(false);
      router.refresh();
      router.push(`/posts?highlight=${post.id}`);
    } catch (e) {
      console.error(e);
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
        <DialogContent className="sm:max-w-[425px]">
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
            <FieldGroup className="">
              <FieldLabel htmlFor="contact-method">Contact Method</FieldLabel>
              <div className="grid grid-cols-6 gap-3">
                <Controller
                  control={form.control}
                  name="contactMethod"
                  render={({ field, fieldState }) => (
                    <Field className="col-span-4">
                      <Input
                        {...field}
                        className="col-span-4"
                        id="contact-method"
                        name="contact-method"
                        placeholder="@lwhrit"
                      />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="contactMethodType"
                  render={({ field, fieldState }) => (
                    <Field className="col-span-2">
                      <Select defaultValue={field.value} onValueChange={field.onChange} {...field}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Method" />
                        </SelectTrigger>
                        <SelectContent align="end" className="[--radius:0.95rem]">
                          <SelectItem value={ContactPlatforms.EMAIL}>Email</SelectItem>
                          <SelectItem value={ContactPlatforms.INSTAGRAM}>Instagram</SelectItem>
                          <SelectItem value={ContactPlatforms.SMS}>SMS</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
              </div>
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
