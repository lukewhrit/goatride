import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { twoFactor } from 'better-auth/plugins';

import { deleteUserAvatars } from '@/lib/avatarStorage';
import {
  sendChangeEmailConfirmation,
  sendResetPasswordEmail,
  sendVerificationEmail,
} from '@/lib/email';
import prisma from '@/lib/prisma';

// eslint-disable-next-line import-x/prefer-default-export
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url, token }) => {
      await sendResetPasswordEmail(user.email, url, token);
    },
    revokeSessionsOnPasswordReset: true,
  },
  // Verification isn't required to sign in, since accounts created before email was wired up are
  // unverified. Set emailAndPassword.requireEmailVerification once that's no longer a concern.
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }) => {
      await sendVerificationEmail(user.email, url, token);
    },
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
      // Verified users approve the change from their old address first; everyone then verifies the
      // new address before it takes effect.
      sendChangeEmailConfirmation: async ({ user, newEmail, url, token }) => {
        await sendChangeEmailConfirmation(user.email, newEmail, url, token);
      },
    },
  },
  // nextCookies must be last so server actions calling auth.api can set cookies.
  plugins: [twoFactor(), nextCookies()],
});
