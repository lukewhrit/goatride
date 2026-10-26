'use client';

import { useEffect, useState } from 'react';

import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import DefaultAvatar from '@/components/defaultAvatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { authClient, signOut, useSession } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

import type { JSX } from 'react';

interface Page {
  key: string;
  title: string;
  url: string;
}

interface Section {
  key: string;
  title: string;
  items: Page[];
}

const sections: Section[] = [
  {
    key: 'preferences',
    title: 'Preferences',
    items: [
      { key: 'personal-details', title: 'Personal details', url: '#preferences' },
      { key: 'my-rides', title: 'My rides', url: '#my-rides' },
    ],
  },
  {
    key: 'privacy-and-security',
    title: 'Privacy and security',
    items: [{ key: 'password', title: 'Change password', url: '#password' }],
  },
];

export const useHash = (): string => {
  const pathname = usePathname();
  const [hash, setHash] = useState('');

  useEffect(() => {
    const update = () => setHash(window.location.hash || '');
    update();
    window.addEventListener('hashchange', update);
    window.addEventListener('popstate', update);
    return () => {
      window.removeEventListener('hashchange', update);
      window.removeEventListener('popstate', update);
    };
  }, [pathname]);

  return hash;
};

const normalize = (s: string) => (s.length > 1 ? s.replace(/\/$/, '') : s);

const useIsActive = () => {
  const pathname = usePathname();
  const hash = useHash();
  const current = `${normalize(pathname)}${hash || ''}`;

  return (item: Page) => {
    const itemUrl = item.url.startsWith('#')
      ? `${normalize(pathname)}${item.url}`
      : normalize(item.url);
    return itemUrl === current;
  };
};

// Scrolling happens in SettingsLayout once the hash state updates, since on mobile the content
// pane is hidden until a section is selected.
const navigateTo = (url: string) => {
  window.history.pushState(null, '', url);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
};

const DeleteAccountDialog = (): JSX.Element => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    const { error } = await authClient.deleteUser();
    setLoading(false);
    if (error) {
      toast.error(error.message ?? 'Failed to delete account');
    } else {
      toast.success('Account deleted');
      router.push('/');
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete account</DialogTitle>
          <DialogDescription>
            This will permanently delete your account and all your rides. This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button className="bg-red-500 hover:bg-red-600" disabled={loading} onClick={handleDelete}>
            {loading ? 'Deleting…' : 'Delete my account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const SettingsLayout = ({ children }: Readonly<{ children: React.ReactNode }>): JSX.Element => {
  const isActive = useIsActive();
  const hash = useHash();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const selected = sections.flatMap((s) => s.items).find((item) => isActive(item));

  useEffect(() => {
    if (!hash) return undefined;
    const frame = requestAnimationFrame(() => {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [hash]);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in');
    }
  }, [isPending, session, router]);

  if (isPending) return <p className="text-center mt-8">Loading…</p>;
  if (!session?.user) return <p className="text-center mt-8">Redirecting…</p>;

  return (
    <div className="flex h-[calc(100dvh-73px)] text-white overflow-hidden border-t border-neutral-800">
      <aside
        className={cn(
          'w-full md:w-72 shrink-0 border-r border-neutral-800 flex-col',
          hash ? 'hidden md:flex' : 'flex',
        )}
      >
        <div className="flex items-center gap-3 px-4 py-3 shrink-0">
          <div className="shrink-0 size-10 rounded-full overflow-hidden flex items-center justify-center">
            {session.user.image ? (
              <Image
                alt="Avatar"
                className="w-full h-full object-cover"
                height={40}
                src={session.user.image}
                width={40}
              />
            ) : (
              <DefaultAvatar />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{session.user.name || 'No Name'}</p>
            <p className="text-sm text-neutral-400 truncate">{session.user.email}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto">
          {sections.map((s) => (
            <div key={s.key} className="pt-3">
              <p className="px-4 pb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
                {s.title}
              </p>
              {s.items.map((item) => (
                <a
                  key={item.key}
                  href={item.url}
                  className={cn(
                    'block w-full px-4 py-3 text-left text-sm transition-colors',
                    isActive(item) ? 'bg-neutral-800' : 'hover:bg-neutral-800/50',
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo(item.url);
                  }}
                >
                  {item.title}
                </a>
              ))}
            </div>
          ))}
        </nav>

        <div className="flex flex-col gap-2 p-4 border-t border-neutral-800 shrink-0">
          <Button
            variant="default"
            onClick={async () => {
              await signOut();
              router.push('/');
            }}
          >
            Sign Out
          </Button>
          <DeleteAccountDialog />
        </div>
      </aside>

      <div className={cn('flex-1 flex-col overflow-hidden', hash ? 'flex' : 'hidden md:flex')}>
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-neutral-800 shrink-0">
          <Button onClick={() => navigateTo(pathname)} size="icon" variant="ghost">
            <ArrowLeftIcon className="size-4" />
          </Button>
          <span>{selected?.title ?? 'Settings'}</span>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default SettingsLayout;
