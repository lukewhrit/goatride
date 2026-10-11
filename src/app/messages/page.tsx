import { Suspense } from 'react';

import MessagesPage from '.';

import type { JSX } from 'react';

const Page = (): JSX.Element => (
  <Suspense fallback={<p className="text-center mt-8 text-white">Loading…</p>}>
    <MessagesPage />
  </Suspense>
);

export default Page;
