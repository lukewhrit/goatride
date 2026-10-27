import { redirect } from 'next/navigation';

import { fetchPosts } from '@/lib/posts';
import { getCurrentUser } from '@/lib/session';
import { searchNearSchema } from '@/lib/validation';

import PostsView from './postsView';

import type { JSX } from 'react';

import type { RideSearch } from './postsView';

const PAGE_SIZE = 12;

const PostsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    to?: string;
    lat?: string;
    lng?: string;
    radius?: string;
  }>;
}): Promise<JSX.Element> => {
  // The proxy only checks that a session cookie exists; this catches expired/revoked sessions
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');

  const { page, to, lat, lng, radius } = await searchParams;

  // A hand-edited or stale URL just shows every ride instead of erroring
  const near =
    lat && lng
      ? searchNearSchema.safeParse({ lat, lng, radiusMiles: radius === '' ? undefined : radius })
      : null;
  const search: RideSearch | undefined = near?.success
    ? { label: to ?? '', ...near.data }
    : undefined;

  const {
    items,
    page: currentPage,
    totalPages,
  } = await fetchPosts({
    page: Number(page) || 1,
    pageSize: PAGE_SIZE,
    rideStatus: 'OPEN',
    near: search,
  });

  return (
    // Remount on a new search so the search box resets to match the URL (e.g. after clearing)
    <PostsView
      key={search ? `${search.lat},${search.lng},${search.radiusMiles}` : 'all'}
      currentPage={currentPage}
      currentUserId={user.id}
      posts={items}
      search={search}
      totalPages={totalPages}
    />
  );
};

export default PostsPage;
