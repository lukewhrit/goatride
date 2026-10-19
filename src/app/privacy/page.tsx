import type { Metadata } from 'next';
import type { JSX } from 'react';

export const metadata: Metadata = { title: 'Privacy Policy' };

// TODO: replace with the real policy before launch
const PrivacyPage = (): JSX.Element => (
  <main className="mx-auto max-w-2xl p-6 space-y-4">
    <h1 className="text-3xl font-bold">Privacy Policy</h1>
    <p className="text-muted-foreground">
      Our privacy policy is being written and will be posted here soon.
    </p>
  </main>
);

export default PrivacyPage;
