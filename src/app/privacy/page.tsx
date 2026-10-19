import { CONTACT_EMAIL, LegalPage } from '@/app/ui/legalPage';

import type { Metadata } from 'next';
import type { JSX } from 'react';

export const metadata: Metadata = { title: 'Privacy Policy | GoatRide' };

const PrivacyPage = (): JSX.Element => (
  <LegalPage title="Privacy Policy">
    <p>
      This Privacy Policy describes how GoatRide (&ldquo;GoatRide,&rdquo; &ldquo;we,&rdquo;
      &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, and discloses information when you use
      our website and related features (the &ldquo;Service&rdquo;). We collect only the information
      needed to operate the Service. We do not sell personal information, and we do not use it for
      advertising.
    </p>

    <h2>1. Information We Collect</h2>
    <ul>
      <li>
        <strong>Account information:</strong> your name, email address, and password (stored only in
        hashed form), and your two-factor authentication settings if you enable that feature.
      </li>
      <li>
        <strong>Profile information:</strong> a profile picture, if you choose to upload one.
      </li>
      <li>
        <strong>Ride information:</strong> details of rides you post, including origin, destination,
        departure date, number of seats, price, and notes, as well as rides you are invited to or
        join.
      </li>
      <li>
        <strong>Messages:</strong> the content of messages you send and receive through the Service.
      </li>
      <li>
        <strong>Technical information:</strong> your IP address and browser type when you sign in,
        and aggregated, anonymous usage and performance statistics.
      </li>
    </ul>

    <h2>2. How We Use Information</h2>
    <p>We use the information we collect to:</p>
    <ul>
      <li>Create and maintain your account and keep it secure.</li>
      <li>Display your ride posts and profile to other users and deliver your messages.</li>
      <li>Send service-related emails, such as email verification and password reset messages.</li>
      <li>Diagnose technical problems and improve the Service.</li>
    </ul>

    <h2>3. Information Visible to Other Users</h2>
    <p>
      Your name, profile picture, and ride posts are visible to other signed-in users. Messages are
      visible only to the participants in the conversation. Drivers can see which users have joined
      their rides. Your email address is not displayed to other users.
    </p>

    <h2>4. Disclosure of Information</h2>
    <p>
      We share information with the following service providers, which process it on our behalf and
      solely to operate the Service:
    </p>
    <ul>
      <li>
        <strong>Vercel</strong>: website hosting, profile picture storage, and anonymous analytics.
      </li>
      <li>
        <strong>Neon</strong>: database hosting.
      </li>
      <li>
        <strong>Resend</strong>: delivery of service-related emails.
      </li>
      <li>
        <strong>Google Maps Platform</strong>: conversion of the locations you enter into map
        coordinates.
      </li>
    </ul>
    <p>
      We may also disclose information if required to do so by law or in response to a valid legal
      request.
    </p>

    <h2>5. Cookies</h2>
    <p>
      We use cookies only to keep you signed in. We do not use advertising or cross-site tracking
      cookies.
    </p>

    <h2>6. Data Retention and Deletion</h2>
    <p>
      We retain your information for as long as your account remains active. You may update your
      name, email address, and profile picture, or delete your account, at any time from your
      account settings. Deleting your account permanently removes your profile, ride posts, and
      messages, including messages you sent in conversations with other users.
    </p>

    <h2>7. Security</h2>
    <p>
      We use reasonable measures to protect your information, including password hashing and
      encrypted connections. However, no method of transmission or storage is completely secure, and
      we cannot guarantee absolute security.
    </p>

    <h2>8. Age Requirements</h2>
    <p>
      The Service is intended for users who are at least 17 years of age, and users under 18 must
      have the consent of a parent or legal guardian. We do not knowingly collect information from
      anyone under 17. If you believe a person under 17 has created an account, please contact us
      and we will delete it.
    </p>

    <h2>9. Changes to This Policy</h2>
    <p>
      We may update this Privacy Policy from time to time. When we do, we will update the effective
      date above and, for material changes, provide notice through the Service.
    </p>

    <h2>10. Contact</h2>
    <p>
      If you have questions about this Privacy Policy or would like to request a copy of your
      information, please contact us at {CONTACT_EMAIL}.
    </p>
  </LegalPage>
);

export default PrivacyPage;
