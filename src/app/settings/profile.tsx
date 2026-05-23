'use client';

import { useRef, useState } from 'react';

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
import { authClient } from '@/lib/auth-client';
import { changeEmail } from '@/lib/user';

import { useUserContext } from '../layout';

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
  })
  .refine((d) => d.email === d.confirmEmail, {
    message: 'Emails do not match',
    path: ['confirmEmail'],
  });

const AvatarUpload = (): JSX.Element => {
  const session = useUserContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(session?.user.image ?? null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2 MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!preview || preview === session?.user.image) return;
    setLoading(true);
    const { error } = await authClient.updateUser({ image: preview });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? 'Failed to update avatar');
    } else {
      toast.success('Avatar updated');
    }
  };

  return (
    <Field orientation="responsive">
      <FieldContent>
        <FieldLabel>Avatar</FieldLabel>
        <FieldDescription>Upload a profile picture (max 2 MB).</FieldDescription>
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
          {preview && preview !== session?.user.image ? (
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
    defaultValues: { email: '', confirmEmail: '' },
  });

  const onSubmit = async (data: z.infer<typeof emailSchema>) => {
    if (data.email === session?.user.email) {
      toast.error('New email must be different from current email');
      return;
    }
    try {
      await changeEmail(data.email);
      toast.success('Email updated — please sign in again');
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
    <div className="w-full max-w-3xl" id="profile">
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
