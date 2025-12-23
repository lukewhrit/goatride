'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
// eslint-disable-next-line import-x/no-namespace
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { signUp } from '@/lib/auth-client';

import type { JSX } from 'react';

const formSchema = z.object({
  fullName: z.string(),
  email: z.email(),
  password: z.string(),
});

const SignUpPage = (): JSX.Element => {
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(formSchema),
  });
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const res = await signUp.email({
      name: data.fullName,
      email: data.email,
      password: data.password,
    });

    if (res.error) {
      setError(res.error.message ?? 'Something went wrong.');
    } else {
      router.push('/settings');
    }
  }

  return (
    <main className="grid grid-cols-2 mx-auto p-6 space-y-4 h-[80vh]">
      <section className="flex flex-col justify-center items-center">
        <div className="max-w-md">
          <h1 className="text-3xl mb-2 font-bold">Create An Account</h1>
          <p>
            Sign up to start sharing and joining rides with people on your campus. Post trips, find
            rides, and turn plans into real journeys.
          </p>
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
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Controller
                  control={form.control}
                  name="fullName"
                  render={({ field, fieldState }) => (
                    <Field {...field}>
                      <FieldLabel htmlFor="name">Full Name</FieldLabel>
                      <Input required id="name" placeholder="John Doe" type="text" />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <Field {...field}>
                      <FieldLabel htmlFor="email">Email Address</FieldLabel>
                      <Input required id="email" placeholder="jmdoe@wpi.edu" type="email" />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <Field {...field}>
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <Input required id="password" placeholder="*********" type="password" />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
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
