'use client';

import { useEffect, useRef, useState } from 'react';

import { UserCircleIcon } from '@heroicons/react/24/solid';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
// eslint-disable-next-line import-x/no-namespace
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { authClient, useSession } from '@/lib/auth-client';
import { uploadAvatar } from '@/lib/avatars';
import { changeEmail } from '@/lib/user';

import { useUserContext } from '../providers';

import type { JSX } from 'react';

const formatStringToUuid = (str: string): string => {
  const cleanStr = str.replace(/-/g, '').substring(0, 32);
  if (cleanStr.length !== 32) return str;
  return `${cleanStr.substring(0, 8)}-${cleanStr.substring(8, 12)}-${cleanStr.substring(12, 16)}-${cleanStr.substring(16, 20)}-${cleanStr.substring(20, 32)}`;
};

const nameSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

const emailSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    confirmEmail: z.string().email('Invalid email address'),
    currentPassword: z.string().min(1, 'Current password is required'),
  })
  .refine((d) => d.email === d.confirmEmail, {
    message: 'Emails do not match',
    path: ['confirmEmail'],
  });

const AVATAR_SIZE = 256;

/*
 * Center-crops and scales an image to a small square in the browser, so uploads stay tiny and the
 * server (a Worker, which can't run image libraries like sharp) only has to store bytes.
 */
const resizeAvatar = async (file: File): Promise<Blob> => {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  canvas
    .getContext('2d')
    ?.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      AVATAR_SIZE,
      AVATAR_SIZE,
    );
  bitmap.close();

  // Browsers that can't encode WebP fall back to PNG, which the server also accepts
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not process image'))),
      'image/webp',
      0.85,
    );
  });
};

const AvatarUpload = (): JSX.Element => {
  const session = useUserContext();
  const { refetch } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ blob: Blob; url: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const preview = pending?.url ?? session?.user.image ?? null;

  // Release the object URL of a discarded or saved preview
  useEffect(
    () => () => {
      if (pending) URL.revokeObjectURL(pending.url);
    },
    [pending],
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10 MB');
      return;
    }

    try {
      const blob = await resizeAvatar(file);
      setPending({ blob, url: URL.createObjectURL(blob) });
    } catch {
      toast.error('Could not read that image');
    }
  };

  const handleSave = async () => {
    if (!pending) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set('avatar', pending.blob, 'avatar');
      await uploadAvatar(formData);
      await refetch();
      setPending(null);
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update avatar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Field orientation="responsive">
      <FieldContent>
        <FieldLabel>Avatar</FieldLabel>
        <FieldDescription>Upload a profile picture (max 10 MB).</FieldDescription>
      </FieldContent>
      <div className="flex items-center gap-4">
        <button
          className="rounded-full overflow-hidden w-16 h-16 border-2 border-neutral-600 flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="Avatar" className="w-full h-full object-cover" src={preview} />
          ) : (
            <div className="w-full h-full bg-neutral-700 flex items-center justify-center">
              <UserCircleIcon className="w-10 h-10 text-neutral-400" />
            </div>
          )}
        </button>
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            size="sm"
            type="button"
            variant="outline"
          >
            Choose image
          </Button>
          {pending ? (
            <Button disabled={loading} onClick={handleSave} size="sm" type="button">
              {loading ? 'Saving…' : 'Save avatar'}
            </Button>
          ) : null}
        </div>
        <input
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          type="file"
        />
      </div>
    </Field>
  );
};

const NameForm = (): JSX.Element => {
  const session = useUserContext();
  const form = useForm({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: session?.user.name ?? '' },
  });

  const onSubmit = async (data: z.infer<typeof nameSchema>) => {
    const { error } = await authClient.updateUser({ name: data.name });
    if (error) {
      toast.error(error.message ?? 'Failed to update name');
    } else {
      toast.success('Name updated');
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Field orientation="responsive">
        <FieldContent>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <FieldDescription>Your display name shown on ride listings.</FieldDescription>
        </FieldContent>
        <div className="flex flex-col gap-2">
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <>
                <Input {...field} id="name" placeholder="Full name" />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </>
            )}
          />
          <Button
            className="self-start"
            disabled={form.formState.isSubmitting}
            size="sm"
            type="submit"
          >
            {form.formState.isSubmitting ? 'Saving…' : 'Save name'}
          </Button>
        </div>
      </Field>
    </form>
  );
};

const EmailForm = (): JSX.Element => {
  const session = useUserContext();
  const form = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '', confirmEmail: '', currentPassword: '' },
  });

  const onSubmit = async (data: z.infer<typeof emailSchema>) => {
    if (data.email === session?.user.email) {
      toast.error('New email must be different from current email');
      return;
    }
    try {
      await changeEmail(data.email, data.currentPassword);
      toast.success('Email updated');
      form.reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update email');
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Field orientation="responsive">
        <FieldContent>
          <FieldLabel>Email</FieldLabel>
          <FieldDescription>
            Current: <span className="font-mono">{session?.user.email}</span>
          </FieldDescription>
        </FieldContent>
        <div className="flex flex-col gap-2">
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <>
                <Input {...field} id="email" placeholder="New email address" type="email" />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </>
            )}
          />
          <Controller
            control={form.control}
            name="confirmEmail"
            render={({ field, fieldState }) => (
              <>
                <Input {...field} id="confirm-email" placeholder="Confirm new email" type="email" />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </>
            )}
          />
          <Controller
            control={form.control}
            name="currentPassword"
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  autoComplete="current-password"
                  id="email-current-password"
                  placeholder="Current password"
                  type="password"
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </>
            )}
          />
          <Button
            className="self-start"
            disabled={form.formState.isSubmitting}
            size="sm"
            type="submit"
          >
            {form.formState.isSubmitting ? 'Saving…' : 'Save email'}
          </Button>
        </div>
      </Field>
    </form>
  );
};

const Profile = (): JSX.Element => {
  const session = useUserContext();

  return (
    <div className="w-full" id="profile">
      <FieldSet>
        <FieldLegend>
          <h3 className="text-xl">Profile</h3>
        </FieldLegend>
        <FieldDescription>Manage your personal details.</FieldDescription>
        <FieldSeparator />
        <FieldGroup>
          <Field orientation="responsive">
            <FieldContent>
              <FieldLabel htmlFor="user-id">User ID</FieldLabel>
              <FieldDescription>A unique identifier for your account.</FieldDescription>
            </FieldContent>
            <p className="self-center font-mono text-sm text-muted-foreground" id="user-id">
              {formatStringToUuid(session?.user.id as string)}
            </p>
          </Field>
          <FieldSeparator />
          <AvatarUpload />
          <FieldSeparator />
          <NameForm />
          <FieldSeparator />
          <EmailForm />
        </FieldGroup>
      </FieldSet>
    </div>
  );
};

export default Profile;
