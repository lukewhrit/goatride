import { Resend } from 'resend';

// Created on first send: the constructor throws without an API key, which would break builds and
// tests that import auth.ts but never send mail
let resend: Resend | undefined;

const FROM = process.env.EMAIL_FROM ?? 'Goatride <noreply@goatride.app>';

const escapeHtml = (s: string): string =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );

/*
 * Minimal single-button layout shared by every transactional email. Inline styles only, since
 * most mail clients strip <style> blocks.
 */
const layout = (heading: string, body: string, buttonLabel: string, url: string): string => `
<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#171717">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:32px">
      <h1 style="margin:0 0 16px;font-size:20px">${heading}</h1>
      <p style="margin:0 0 24px;line-height:1.5">${body}</p>
      <a href="${escapeHtml(url)}" style="display:inline-block;background:#171717;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600">${buttonLabel}</a>
      <p style="margin:24px 0 0;font-size:13px;color:#737373;line-height:1.5">
        If the button doesn't work, paste this link into your browser:<br>
        <a href="${escapeHtml(url)}" style="color:#737373;word-break:break-all">${escapeHtml(url)}</a>
      </p>
      <p style="margin:16px 0 0;font-size:13px;color:#737373">If you didn't request this, you can ignore this email.</p>
    </div>
  </body>
</html>`;

interface Email {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
}

/*
 * The Resend SDK returns errors instead of throwing; we throw so better-auth surfaces the failure
 * to the caller rather than reporting success for an email that was never sent.
 */
const send = async ({ to, subject, html, text, idempotencyKey }: Email): Promise<void> => {
  resend ??= new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send(
    { from: FROM, to, subject, html, text },
    { idempotencyKey: idempotencyKey.slice(0, 256) },
  );
  if (error) throw new Error(`Failed to send "${subject}" email: ${error.message}`);
};

// Tokens are single-use, so they make natural idempotency keys
export const sendVerificationEmail = async (
  to: string,
  url: string,
  token: string,
): Promise<void> =>
  send({
    to,
    subject: 'Verify your Goatride email',
    html: layout(
      'Verify your email',
      'Confirm this address to finish setting up your Goatride account.',
      'Verify email',
      url,
    ),
    text: `Confirm this address to finish setting up your Goatride account:\n\n${url}`,
    idempotencyKey: `verify-email/${token}`,
  });

export const sendResetPasswordEmail = async (
  to: string,
  url: string,
  token: string,
): Promise<void> =>
  send({
    to,
    subject: 'Reset your Goatride password',
    html: layout(
      'Reset your password',
      'Someone asked to reset the password for this account. The link expires in one hour.',
      'Reset password',
      url,
    ),
    text: `Reset your Goatride password (link expires in one hour):\n\n${url}`,
    idempotencyKey: `reset-password/${token}`,
  });

export const sendChangeEmailConfirmation = async (
  to: string,
  newEmail: string,
  url: string,
  token: string,
): Promise<void> =>
  send({
    to,
    subject: 'Confirm your Goatride email change',
    html: layout(
      'Confirm email change',
      `Someone asked to change this account's email to <strong>${escapeHtml(newEmail)}</strong>. Approve the change below; we'll then send a verification link to the new address.`,
      'Approve change',
      url,
    ),
    text: `Someone asked to change your Goatride email to ${newEmail}. Approve the change:\n\n${url}`,
    idempotencyKey: `change-email/${token}`,
  });
