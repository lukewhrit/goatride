import { Skeleton } from '@/components/ui/skeleton';

import type { JSX } from 'react';

const PostsLoading = (): JSX.Element => (
  <div aria-busy="true" aria-label="Loading rides">
    <div className="flex flex-col items-center justify-center gap-3 w-full">
      <h1 className="font-sans font-extrabold text-4xl">Where are you going?</h1>
      <Skeleton className="h-9 w-full max-w-lg" />
    </div>
    <div className="my-5 px-10 grid grid-cols-1 lg:grid-cols-4 gap-3">
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-44" />
      ))}
    </div>
  </div>
);

export default PostsLoading;
