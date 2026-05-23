'use client';

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

import type { JSX } from 'react';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
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
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    const { error } = await authClient.changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      revokeOtherSessions: true,
    });

    if (error) {
      if (error.status === 400) {
        form.setError('currentPassword', { message: 'Current password is incorrect' });
      } else {
        toast.error(error.message ?? 'Failed to change password');
      }
    } else {
      toast.success('Password changed — other sessions have been signed out');
      form.reset();
    }
  };

  return (
    <section className="w-full max-w-3xl" id="password">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldSet>
          <FieldLegend>
            <h3 className="text-xl">Change password</h3>
          </FieldLegend>
          <FieldDescription>Choose a strong password of at least 8 characters.</FieldDescription>
          <FieldSeparator />
          <FieldGroup>
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="current-password">Current password</FieldLabel>
              </FieldContent>
              <div className="flex flex-col gap-2">
                <Controller
                  control={form.control}
                  name="currentPassword"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        autoComplete="current-password"
                        id="current-password"
                        type="password"
                      />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </>
                  )}
                />
              </div>
            </Field>
            <FieldSeparator />
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="new-password">New password</FieldLabel>
              </FieldContent>
              <div className="flex flex-col gap-2">
                <Controller
                  control={form.control}
                  name="newPassword"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        autoComplete="new-password"
                        id="new-password"
                        type="password"
                      />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </>
                  )}
                />
                <Controller
                  control={form.control}
                  name="confirmPassword"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        autoComplete="new-password"
                        id="confirm-password"
                        placeholder="Confirm new password"
                        type="password"
                      />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </>
                  )}
                />
              </div>
            </Field>
            <FieldSeparator />
            <Field>
              <Button disabled={form.formState.isSubmitting} type="submit">
                {form.formState.isSubmitting ? 'Changing…' : 'Change password'}
              </Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>
    </section>
  );
};

export default ChangePassword;
