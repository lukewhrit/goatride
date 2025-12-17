'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { signUp } from '@/lib/auth-client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import type { JSX } from 'react';

const SignUpPage = (): JSX.Element => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    const res = await signUp.email({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });

    if (res.error) {
      setError(res.error.message ?? 'Something went wrong.');
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <main className="grid grid-cols-2 mx-auto p-6 space-y-4">
      <section className="flex flex-col justify-center items-center">
        <div>
          <h1 className="text-3xl font-bold">Create An Account</h1>
          <p>Lorem ipsum...</p>
        </div>
        {error ? <p className="text-red-500">{error}</p> : null}
      </section>
      <section className="flex flex-col justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Create an account</CardTitle>
            <CardDescription>Enter your information below to create an account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Full Name</FieldLabel>
                  <Input required id="name" placeholder="John Doe" type="text" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">Email address</FieldLabel>
                  <Input required id="email" placeholder="jmdoe@wpi.edu" type="email" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Full Name</FieldLabel>
                  <Input
                    required
                    id="password"
                    minLength={8}
                    placeholder="Password"
                    type="password"
                  />
                </Field>
                <FieldGroup>
                  <Field>
                    <Button type="submit">Create Account</Button>
                    <FieldDescription className="px-6 text-center">
                      Already have an account? <a href="/sign-in">Sign in</a>
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

export default SignUpPage;
