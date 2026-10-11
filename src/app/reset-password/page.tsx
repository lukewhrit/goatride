import ResetPasswordForm from './form';

import type { JSX } from 'react';

// better-auth redirects here from the emailed link with either ?token=... or ?error=INVALID_TOKEN
const ResetPasswordPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}): Promise<JSX.Element> => {
  const { token, error } = await searchParams;

  return (
    <main className="flex justify-center items-center p-6 h-[80vh]">
      <ResetPasswordForm token={error ? undefined : token} />
    </main>
  );
};

export default ResetPasswordPage;
