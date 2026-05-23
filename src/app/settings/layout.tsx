'use client';

import { useEffect, useState } from 'react';

import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/solid';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { authClient, signOut, useSession } from '@/lib/auth-client';

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
    key: 'password-and-security',
    title: 'Password and security',
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

const scrollToSection = (hash: string) => {
  if (!hash.startsWith('#')) return;
  history.pushState(null, '', hash);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  const el = document.querySelector(hash);
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        <Button className="bg-red-500 text-white hover:bg-red-600">Delete Account</Button>
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
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in');
    }
  }, [isPending, session, router]);

  if (isPending) return <p className="text-center mt-8 text-white">Loading…</p>;
  if (!session?.user) return <p className="text-center mt-8 text-white">Redirecting…</p>;

  return (
    <div>
      <SidebarProvider className="border-t-1">
        <Sidebar className="sticky h-full" collapsible="icon" variant="sidebar">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex p-1 gap-3 items-center">
                  <div className="flex overflow-hidden aspect-square size-8 items-center justify-center rounded-full">
                    <img alt="Avatar" className="w-full h-full" src={session?.user.image ?? ''} />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span>{session.user.name || 'No Name'}</span>
                    <span className="font-mono text-sm text-secondary-foreground">
                      {session.user.email}
                    </span>
                  </div>
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            {sections.map((s) => (
              <SidebarGroup key={s.key}>
                <SidebarGroupLabel>{s.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {s.items.map((item) => (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton asChild isActive={isActive(item)}>
                          <a
                            href={item.url}
                            onClick={(e) => {
                              e.preventDefault();
                              scrollToSection(item.url);
                            }}
                          >
                            {item.title}
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter>
            <Button
              onClick={async () => {
                await signOut();
                router.push('/');
              }}
            >
              Sign Out
            </Button>
            <DeleteAccountDialog />
          </SidebarFooter>
        </Sidebar>
        <main className="w-full h-screen space-y-4 text-white">{children}</main>
      </SidebarProvider>
    </div>
  );
};

export default SettingsLayout;
