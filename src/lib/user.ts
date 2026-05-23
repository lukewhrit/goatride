'use server';

import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function changeEmail(newEmail: string): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Not authenticated');

  const existing = await prisma.user.findUnique({ where: { email: newEmail } });
  if (existing) throw new Error('Email is already in use');

  await prisma.user.update({
    where: { id: session.user.id },
    data: { email: newEmail },
  });
}
