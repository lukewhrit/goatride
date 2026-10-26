'use client';

import { useState } from 'react';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { authClient, useSession } from '@/lib/auth-client';

import type { JSX } from 'react';

/*
 * Unverified users can browse but every action is refused server side (requireVerifiedUser), so
 * tell them why up front. Accounts created before email was wired up never got a link, hence the
 * resend button.
 */
const VerifyEmailBanner = (): JSX.Element | null => {
  const { data: session } = useSession();
  const [sending, setSending] = useState(false);

  if (!session?.user || session.user.emailVerified) return null;
  const { email } = session.user;

  const resend = async () => {
    setSending(true);
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: window.location.pathname,
    });
    setSending(false);
    if (error) toast.error(error.message ?? 'Could not send verification email');
    else toast.success(`Verification email sent to ${email}`);
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-y border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm">
      <p>
        Verify your email address to post or join rides and send messages. Check{' '}
        <span className="font-medium">{email}</span> for a link.
      </p>
      <Button disabled={sending} onClick={resend} size="sm" variant="outline">
        {sending ? 'Sending…' : 'Resend email'}
      </Button>
    </div>
  );
};

export default VerifyEmailBanner;
