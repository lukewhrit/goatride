import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { nextCookies } from 'better-auth/next-js';
import { twoFactor } from 'better-auth/plugins';

import { deleteUserAvatars } from '@/lib/avatarStorage';
import {
  sendChangeEmailConfirmation,
  sendResetPasswordEmail,
  sendVerificationEmail,
} from '@/lib/email';
import prisma from '@/lib/prisma';
import { EMAIL_DOMAIN_MESSAGE, isAllowedEmail } from '@/lib/validation';

// Endpoints that set an account's email, and the body field holding the new address
const emailFieldByPath: Record<string, string | undefined> = {
  '/sign-up/email': 'email',
  '/change-email': 'newEmail',
};

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
  // unverified. Instead, server actions refuse unverified users (requireVerifiedUser) so they can
  // still sign in and resend the link. Set emailAndPassword.requireEmailVerification once that's
  // no longer a concern.
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
  hooks: {
    // The sign-up form checks the domain too, but the endpoints are public. Email changes are
    // covered so an account can't sign up with a campus address and then switch away from it.
    before: createAuthMiddleware(async (ctx) => {
      const field = emailFieldByPath[ctx.path];
      const email = field && (ctx.body as Record<string, unknown> | undefined)?.[field];
      if (typeof email === 'string' && !isAllowedEmail(email)) {
        throw APIError.from('BAD_REQUEST', {
          code: 'EMAIL_DOMAIN_NOT_ALLOWED',
          message: EMAIL_DOMAIN_MESSAGE,
        });
      }
    }),
  },
  // nextCookies must be last so server actions calling auth.api can set cookies.
  plugins: [twoFactor(), nextCookies()],
});
