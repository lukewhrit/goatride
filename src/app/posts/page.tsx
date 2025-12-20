'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { Dialog } from '@/components/ui/dialog';
import { useSession } from '@/lib/auth-client';

import PostRideForm from './form';

import type { JSX } from 'react';

const DashboardPage = (): JSX.Element => {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in');
    }
  }, [isPending, session, router]);

  if (isPending) return <p className="text-center mt-8 text-white">Loading...</p>;
  if (!session?.user) return <p className="text-center mt-8 text-white">Redirecting...</p>;

  return (
    <div>
      <header className="flex flex-col items-center justify-items-center">
        <PostRideForm user={session.user} />
      </header>
      <main>{/* Bento-style grid of posts */}</main>
    </div>
  );
};

export default DashboardPage;
