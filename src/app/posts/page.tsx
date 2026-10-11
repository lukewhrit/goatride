import { redirect } from 'next/navigation';

import { fetchPosts } from '@/lib/posts';
import { getCurrentUser } from '@/lib/session';

import PostsView from './postsView';

import type { JSX } from 'react';

const PAGE_SIZE = 12;

const PostsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<JSX.Element> => {
  // The proxy only checks that a session cookie exists; this catches expired/revoked sessions
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');

  const { page } = await searchParams;
  const {
    items,
    page: currentPage,
    totalPages,
  } = await fetchPosts({
    page: Number(page) || 1,
    pageSize: PAGE_SIZE,
    rideStatus: 'OPEN',
  });

  return (
    <PostsView
      currentPage={currentPage}
      currentUserId={user.id}
      posts={items}
      totalPages={totalPages}
    />
  );
};

export default PostsPage;
