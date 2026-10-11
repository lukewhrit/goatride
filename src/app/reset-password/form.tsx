'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';

import type { JSX } from 'react';

const ResetPasswordForm = ({ token }: { token?: string }): JSX.Element => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Link expired</CardTitle>
          <CardDescription>
            This reset link is invalid or has expired.{' '}
            <a className="underline" href="/forgot-password">
              Request a new one
            </a>
            .
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get('password') as string;
    if (newPassword !== formData.get('confirmPassword')) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const res = await authClient.resetPassword({ newPassword, token });
    setSubmitting(false);

    if (res.error) {
      setError(res.error.message ?? 'Something went wrong.');
    } else {
      toast.success('Password reset. Sign in with your new password.');
      router.push('/sign-in');
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>You&apos;ll be signed out of all other devices.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="password">New password</FieldLabel>
              <Input
                required
                autoComplete="new-password"
                id="password"
                minLength={8}
                name="password"
                type="password"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
              <Input
                required
                autoComplete="new-password"
                id="confirm-password"
                minLength={8}
                name="confirmPassword"
                type="password"
              />
            </Field>
            {error ? <p className="text-red-500">{error}</p> : null}
            <Field>
              <Button disabled={submitting} type="submit">
                {submitting ? 'Saving…' : 'Reset password'}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
};

export default ResetPasswordForm;
