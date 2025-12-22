'use client';

import { Bars3Icon } from '@heroicons/react/24/solid';
import { router } from 'better-auth/api';
import Image from 'next/image';
import Link from 'next/link';

import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useSession } from '@/lib/auth-client';

import type { JSX } from 'react';

export interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface NavbarProps {
  logo: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  menu: MenuItem[];
  auth: {
    signin: {
      title: string;
      url: string;
    };
    signup: {
      title: string;
      url: string;
    };
  };
}

const renderMenuItem = (item: MenuItem) => (
  <NavigationMenuItem key={item.title}>
    <NavigationMenuLink
      className="bg-background hover:bg-muted hover:text-accent-foreground group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
      href={item.url}
    >
      {item.title}
    </NavigationMenuLink>
  </NavigationMenuItem>
);

const renderMobileMenuItem = (item: MenuItem) => (
  <a key={item.title} className="text-md font-semibold" href={item.url}>
    {item.title}
  </a>
);

export const Navbar = ({ auth, logo, menu }: NavbarProps): JSX.Element => {
  const { data: session, isPending } = useSession();

  return (
    <section className="py-4 justify-center flex">
      <div className="container">
        {/* Desktop Menu */}
        <nav className="hidden items-center justify-between lg:flex">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <a className="flex items-center gap-2" href={logo.url}>
              <Image alt={logo.alt} height={32} src={logo.src} width={32} />
              <span className="text-lg font-semibold tracking-tighter">{logo.title}</span>
            </a>
            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList>{menu.map((item) => renderMenuItem(item))}</NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
          <div>
            {isPending || !session?.user ? (
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <a href={auth.signin.url}>{auth.signin.title}</a>
                </Button>
                <Button asChild>
                  <a href={auth.signup.url}>{auth.signup.title}</a>
                </Button>
              </div>
            ) : (
              <Button
                asChild
                className="flex gap-2 justify-center items-center p-4"
                variant="outline"
              >
                <Link href="/settings">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-full">
                    <Bars3Icon className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-medium">{session?.user.name ?? 'User'}</span>
                    <span className="font-mono text-sm">{session?.user.email}</span>
                  </div>
                </Link>
              </Button>
            )}
          </div>
        </nav>

        {/* Mobile Menu */}
        <div className="block lg:hidden">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a className="flex items-center gap-2" href={logo.url}>
              <img alt={logo.alt} className="max-h-8 dark:invert" src={logo.src} />
            </a>
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline">
                  <Bars3Icon className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <a className="flex items-center gap-2" href={logo.url}>
                      <img alt={logo.alt} className="max-h-8 dark:invert" src={logo.src} />
                    </a>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 p-4">
                  <Accordion collapsible className="flex w-full flex-col gap-4" type="single">
                    {menu.map((item) => renderMobileMenuItem(item))}
                  </Accordion>

                  <div>
                    {isPending || !session?.user ? (
                      <div className="flex flex-col gap-3">
                        <Button asChild variant="outline">
                          <a href={auth.signin.url}>{auth.signin.title}</a>
                        </Button>
                        <Button asChild>
                          <a href={auth.signup.url}>{auth.signup.title}</a>
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                          <Bars3Icon className="size-4" />
                        </div>
                        <div className="flex flex-col gap-0.5 leading-none">
                          <span className="font-medium">{session?.user.name ?? 'User'}</span>
                          <span className="font-mono text-sm">{session?.user.email}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  );
};
