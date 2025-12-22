'use client';

import { useEffect, useState } from 'react';

import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/solid';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
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
import { signOut, useSession } from '@/lib/auth-client';

import type { JSX } from 'react';

interface Page {
  title: string;
  url: string;
}

interface Section {
  title: string;
  items: Page[];
}

const sections: Section[] = [
  {
    title: 'Preferences',
    items: [
      { title: 'Personal details', url: '/settings/#preferences' },
      { title: 'My rides', url: '/settings/my-rides' },
    ],
  },
  {
    title: 'Password and security',
    items: [
      { title: 'Change password', url: '/settings/#password' },
      { title: 'Two-factor authentication', url: '/settings/#2fa' },
    ],
  },
];

const useHash = () => {
  const [hash, setHash] = useState<string>('');

  useEffect(() => {
    const update = () => setHash(window.location.hash || '');
    update(); // set initial hash

    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);

  return hash;
};

const normalize = (s: string) => (s.length > 1 ? s.replace(/\/$/, '') : s);

const useIsActive = () => {
  const pathname = usePathname();
  const hash = useHash();

  const current = normalize(hash || pathname);

  return (item: Page) => {
    const itemKey = item.url.startsWith('#') ? normalize(item.url) : normalize(item.url);

    // match by URL
    if (itemKey === current) return true;

    // optional: match by "title" (only if you really want this)
    // (better: compare to a route key, not a human title)
    return item.title.toLowerCase() === current.toLowerCase();
  };
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

  if (isPending) return <p className="text-center mt-8 text-white">Loading...</p>;
  if (!session?.user) return <p className="text-center mt-8 text-white">Redirecting...</p>;

  return (
    <div>
      <SidebarProvider className="border-t-1">
        <Sidebar className="sticky h-full" collapsible="icon" variant="sidebar">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild size="lg">
                  <div>
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                      <AdjustmentsHorizontalIcon className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-medium">user</span>
                      <span className="font-mono text-sm">email</span>
                    </div>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            {sections.map((s) => (
              <SidebarGroup key={s.title}>
                <SidebarGroupLabel>{s.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {s.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive(item)}>
                          <a href={item.url}>{item.title}</a>
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
                signOut();
                router.push('/');
              }}
            >
              Sign Out
            </Button>
            <Button className="bg-red-500 text-white hover:bg-red-600">Delete Account</Button>
          </SidebarFooter>
        </Sidebar>
        <main className="max-w-4xl h-screen p-6 space-y-4 text-white">{children}</main>
      </SidebarProvider>
    </div>
  );
};

export default SettingsLayout;
