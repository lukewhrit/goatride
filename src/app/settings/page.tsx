'use client';

import { useEffect } from 'react';

import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';

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

const sections = [
  {
    title: 'Preferences',
    items: [{ title: 'Personal details', url: '/', isActive: true }],
  },
  {
    title: 'Password and security',
    items: [
      { title: 'Change password', url: '/', isActive: false },
      { title: 'Two-factor authentication', url: '/', isActive: false },
    ],
  },
];

const SettingsPage = (): JSX.Element => {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in');
    }
  }, [isPending, session, router]);

  if (isPending) return <p className="text-center mt-8 text-white">Loading...</p>;
  if (!session?.user) return <p className="text-center mt-8 text-white">Redirecting...</p>;

  const { user } = session;

  return (
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
                    <span className="font-medium">{user.name || 'User'}</span>
                    <span className="font-mono text-sm">{user.email}</span>
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
                      <SidebarMenuButton asChild isActive={item.isActive}>
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
          <Button onClick={async () => signOut()}>Sign Out</Button>
          <Button className="bg-red-500 text-white hover:bg-red-600">Delete Account</Button>
        </SidebarFooter>
      </Sidebar>
      <main className="max-w-md h-screen flex items-center justify-center flex-col mx-auto p-6 space-y-4 text-white">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p>Welcome, {user.name || 'User'}!</p>
        <p>Email: {user.email}</p>
      </main>
    </SidebarProvider>
  );
};

export default SettingsPage;
