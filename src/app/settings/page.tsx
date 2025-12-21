'use client';

import { useEffect } from 'react';

import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
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
    items: [
      { title: 'Personal details', url: '#preferences', isActive: true },
      { title: 'My rides', url: '/settings/rides', isActive: false },
    ],
  },
  {
    title: 'Password and security',
    items: [
      { title: 'Change password', url: '#password', isActive: false },
      { title: 'Two-factor authentication', url: '#2fa', isActive: false },
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
      <main className="max-w-4xl h-screen p-6 space-y-4 text-white">
        <h1 className="text-2xl">Settings</h1>
        <section>
          <h2 className="text-xl" id="preferences">
            Preferences
          </h2>
        </section>
        <section>
          <h2 className="text-xl" id="privacy-and-security">
            Privacy and security
          </h2>
          <section>
            <FieldSet>
              <FieldLegend>Address Information</FieldLegend>
              <FieldDescription>We need your address to deliver your order.</FieldDescription>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="street">Current password</FieldLabel>
                  <Input id="street" placeholder="123 Main St" type="text" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="city">City</FieldLabel>
                    <Input id="city" placeholder="New York" type="text" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="zip">Postal Code</FieldLabel>
                    <Input id="zip" placeholder="90502" type="text" />
                  </Field>
                </div>
              </FieldGroup>
            </FieldSet>
          </section>
          <section>
            <h3 className="text-lg" id="2fa">
              Two-factor authentication
            </h3>
          </section>
        </section>
      </main>
    </SidebarProvider>
  );
};

export default SettingsPage;
