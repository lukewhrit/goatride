'use client';

import { createContext, useContext, useEffect, useState } from 'react';

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

import type { User } from 'better-auth';
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
    items: [
      { key: 'password', title: 'Change password', url: '#password' },
      { key: '2fa', title: 'Two-factor authentication', url: '#2fa' },
    ],
  },
];

export const useHash = (): string => {
  const pathname = usePathname(); // rerun effect when Next navigates
  const [hash, setHash] = useState('');

  useEffect(() => {
    const update = () => setHash(window.location.hash || '');

    update(); // initial + after any navigation

    // still handle true hash-only changes (like clicking #... links)
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

interface UserSession {
  user: User;
  session: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null | undefined;
    userAgent?: string | null | undefined;
  };
}

const userCtx = createContext<UserSession | undefined>(undefined);

export const useUserContext = (): UserSession | undefined => useContext(userCtx);

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
                <div className="flex p-1 gap-3 items-center">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <AdjustmentsHorizontalIcon className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span>{session.user.name || 'No Name'}</span>
                    <span className="font-mono text-sm">{session.user.email}</span>
                  </div>
                </div>
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
        <main className="w-full h-screen space-y-4 text-white">
          <userCtx.Provider value={session}>{children}</userCtx.Provider>
        </main>
      </SidebarProvider>
    </div>
  );
};

export default SettingsLayout;
