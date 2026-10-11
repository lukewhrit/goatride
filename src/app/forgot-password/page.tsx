'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';

import type { JSX } from 'react';

const ForgotPasswordPage = (): JSX.Element => {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const res = await authClient.requestPasswordReset({
      email: formData.get('email') as string,
      redirectTo: '/reset-password',
    });

    setSubmitting(false);
    if (res.error) {
      setError(res.error.message ?? 'Something went wrong.');
    } else {
      setSent(true);
    }
  }

  return (
    <main className="flex justify-center items-center p-6 h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            {sent
              ? "If an account exists for that address, we've sent a link to reset your password."
              : "Enter your account's email and we'll send you a reset link."}
          </CardDescription>
        </CardHeader>
        {sent ? null : (
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email address</FieldLabel>
                  <Input
                    required
                    id="email"
                    name="email"
                    placeholder="jmdoe@wpi.edu"
                    type="email"
                  />
                </Field>
                {error ? <p className="text-red-500">{error}</p> : null}
                <Field>
                  <Button disabled={submitting} type="submit">
                    {submitting ? 'Sending…' : 'Send reset link'}
                  </Button>
                  <FieldDescription className="px-6 text-center">
                    Remembered it? <a href="/sign-in">Sign in</a>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        )}
      </Card>
    </main>
  );
};

export default ForgotPasswordPage;
