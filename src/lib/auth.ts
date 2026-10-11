import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { twoFactor } from 'better-auth/plugins';

import { deleteUserAvatars } from '@/lib/avatarStorage';
import prisma from '@/lib/prisma';

// eslint-disable-next-line import-x/prefer-default-export
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        // Don't block account deletion on storage errors; leftover files are unreachable anyway
        await deleteUserAvatars(user.id).catch((e: unknown) => {
          console.error(`Failed to delete avatars for ${user.id}`, e);
        });
      },
    },
    changeEmail: {
      enabled: true,
      // No email provider is wired up yet, so unverified users change email directly (guarded by a
      // password check in lib/user.ts). Add sendChangeEmailVerification once email is set up.
      updateEmailWithoutVerification: true,
    },
  },
  // nextCookies must be last so server actions calling auth.api can set cookies.
  plugins: [twoFactor(), nextCookies()],
});
