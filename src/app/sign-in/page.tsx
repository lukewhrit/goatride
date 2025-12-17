'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { signIn } from '@/lib/auth-client';

import type { JSX } from 'react';

const SignInPage = (): JSX.Element => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    const res = await signIn.email({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });

    if (res.error) {
      setError(res.error.message ?? 'Something went wrong.');
    } else {
      router.push('/settings');
    }
  }

  return (
    <main className="grid grid-cols-2 mx-auto p-6 space-y-4">
      <section className="flex flex-col justify-center items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p>Lorem ipsum...</p>
        </div>
        {error ? <p className="text-red-500">{error}</p> : null}
      </section>
      <section className="flex flex-col justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>Enter your information below to access your account.</CardDescription>
          </CardHeader>
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
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    required
                    id="password"
                    minLength={8}
                    name="password"
                    placeholder="Password"
                    type="password"
                  />
                </Field>
                <FieldGroup>
                  <Field>
                    <Button type="submit">Sign In</Button>
                    <FieldDescription className="px-6 text-center">
                      Don&apos;t have an account? <a href="/sign-up">Sign up</a>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default SignInPage;
