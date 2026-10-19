import type { Metadata } from 'next';
import type { JSX } from 'react';

export const metadata: Metadata = { title: 'Terms of Service' };

// TODO: replace with the real terms before launch
const TermsPage = (): JSX.Element => (
  <main className="mx-auto max-w-2xl p-6 space-y-4">
    <h1 className="text-3xl font-bold">Terms of Service</h1>
    <p className="text-muted-foreground">
      Our terms of service are being written and will be posted here soon.
    </p>
  </main>
);

export default TermsPage;
