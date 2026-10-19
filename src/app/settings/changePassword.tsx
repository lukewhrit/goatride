'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
} from '@/components/ui/dialog';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';

import type { JSX } from 'react';
import type { FieldErrors } from 'react-hook-form';

const schema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const ChangePassword = (): JSX.Element => {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });
  // Set once the new password fields validate; opens the dialog asking for the current password
  const [pendingPassword, setPendingPassword] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirming, setConfirming] = useState(false);

  const onSubmit = (data: z.infer<typeof schema>) => {
    setPendingPassword(data.newPassword);
  };

  const onInvalid = (errors: FieldErrors<z.infer<typeof schema>>) => {
    const message = errors.newPassword?.message ?? errors.confirmPassword?.message;
    if (message) toast.error(message);
  };

  const closeDialog = () => {
    setPendingPassword(null);
    setCurrentPassword('');
  };

  const onConfirm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pendingPassword || !currentPassword) return;
    setConfirming(true);
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword: pendingPassword,
      revokeOtherSessions: true,
    });
    setConfirming(false);

    if (error) {
      toast.error(
        error.status === 400
          ? 'Current password is incorrect'
          : (error.message ?? 'Failed to change password'),
      );
      setCurrentPassword('');
    } else {
      toast.success('Password changed — other sessions have been signed out');
      closeDialog();
      form.reset();
    }
  };

  return (
    <section className="w-full" id="password">
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
        <FieldSet>
          <FieldLegend>
            <h3 className="text-xl">Privacy and security</h3>
          </FieldLegend>
          <FieldSeparator />
          <FieldGroup>
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="new-password">Change password</FieldLabel>
                <FieldDescription>
                  Choose a strong password with at least 8 characters.
                </FieldDescription>
              </FieldContent>
              <div className="gap-2 grid grid-cols-2">
                <Controller
                  control={form.control}
                  name="newPassword"
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      autoComplete="new-password"
                      id="new-password"
                      placeholder="New password"
                      type="password"
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name="confirmPassword"
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      autoComplete="new-password"
                      id="confirm-password"
                      placeholder="Confirm new password"
                      type="password"
                    />
                  )}
                />
                <Button className="col-span-2 justify-self-end" size="sm" type="submit">
                  Save password
                </Button>
              </div>
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>
      {/* Kept outside the form above so its submit event doesn't bubble into it */}
      <Dialog
        onOpenChange={(open) => (open ? null : closeDialog())}
        open={pendingPassword !== null}
      >
        <DialogContent className="sm:max-w-md">
          <form className="grid gap-4" onSubmit={onConfirm}>
            <DialogHeader>
              <DialogTitle>Confirm your password</DialogTitle>
              <DialogDescription>
                Enter your current password to change it. Your other sessions will be signed out.
              </DialogDescription>
            </DialogHeader>
            <Input
              autoFocus
              autoComplete="current-password"
              id="current-password"
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              type="password"
              value={currentPassword}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button disabled={confirming || !currentPassword} type="submit">
                {confirming ? 'Changing…' : 'Change password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ChangePassword;
