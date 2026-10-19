import { UserCircleIcon } from '@heroicons/react/24/solid';

import type { JSX } from 'react';

/** Placeholder for users without an avatar; fills its (usually round) container. */
const DefaultAvatar = (): JSX.Element => (
  <div className="w-full h-full bg-neutral-700 flex items-center justify-center">
    <UserCircleIcon className="w-5/8 h-5/8 text-neutral-400" />
  </div>
);

export default DefaultAvatar;
