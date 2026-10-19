'use client';

import { useEffect, useState } from 'react';

import { Bars3Icon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import DefaultAvatar from '@/components/defaultAvatar';
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
import { MESSAGES_READ_EVENT } from '@/lib/messageEvents';
import { getUnreadMessageCount } from '@/lib/messages';

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

const UnreadBadge = ({ count }: { count: number }): JSX.Element | null =>
  count > 0 ? (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs font-semibold leading-none text-white">
      {count > 99 ? '99+' : count}
      <span className="sr-only"> unread {count === 1 ? 'message' : 'messages'}</span>
    </span>
  ) : null;

/** Polls the unread message count while signed in; refreshes on navigation, focus and reads. */
const useUnreadMessageCount = (signedIn: boolean): number => {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!signedIn) return undefined;
    let cancelled = false;
    const refresh = async () => {
      try {
        const n = await getUnreadMessageCount();
        if (!cancelled) setCount(n);
      } catch {
        // silently fail on background polls
      }
    };

    refresh();
    const interval = setInterval(refresh, 15_000);
    window.addEventListener('focus', refresh);
    window.addEventListener(MESSAGES_READ_EVENT, refresh);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', refresh);
      window.removeEventListener(MESSAGES_READ_EVENT, refresh);
    };
  }, [signedIn, pathname]);

  return signedIn ? count : 0;
};

const renderMenuItem = (item: MenuItem, badge: number) => (
  <NavigationMenuItem key={item.title}>
    <NavigationMenuLink
      className="bg-background hover:bg-muted hover:text-accent-foreground group inline-flex flex-row gap-2 h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
      href={item.url}
    >
      {item.title}
      <UnreadBadge count={badge} />
    </NavigationMenuLink>
  </NavigationMenuItem>
);

const renderMobileMenuItem = (item: MenuItem, badge: number) => (
  <a key={item.title} className="text-md font-semibold flex items-center gap-2" href={item.url}>
    {item.title}
    <UnreadBadge count={badge} />
  </a>
);

export const Navbar = ({ auth, logo, menu }: NavbarProps): JSX.Element => {
  const { data: session, isPending } = useSession();
  const unread = useUnreadMessageCount(!!session?.user);
  const badgeFor = (item: MenuItem) => (item.url === '/messages' ? unread : 0);

  return (
    <section className="py-4 justify-center flex">
      <div className="container">
        {/* Desktop Menu */}
        <nav className="hidden items-center justify-between lg:flex">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <a className="flex items-center gap-2" href={logo.url}>
              <Image preload alt={logo.alt} height={32} src={logo.src} width={32} />
              <span className="text-lg font-semibold tracking-tighter">{logo.title}</span>
            </a>
            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {menu.map((item) => renderMenuItem(item, badgeFor(item)))}
                </NavigationMenuList>
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
                className="flex gap-2 justify-center items-center py-1.5 px-2"
                size="expand"
                variant="ghost"
              >
                <Link href="/settings">
                  <div className="flex overflow-hidden aspect-square size-8 items-center justify-center rounded-full">
                    {session.user.image ? (
                      <Image
                        alt="Avatar"
                        className="w-full h-full object-cover"
                        height={32}
                        src={session.user.image}
                        width={32}
                      />
                    ) : (
                      <DefaultAvatar />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-medium">{session?.user.name ?? 'User'}</span>
                    <span className="font-mono text-sm text-secondary-foreground">
                      {session?.user.email}
                    </span>
                  </div>
                </Link>
              </Button>
            )}
          </div>
        </nav>

        {/* Mobile Menu */}
        <div className="block px-5 lg:hidden">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a className="flex items-center gap-2" href={logo.url}>
              <Image alt={logo.alt} height={32} src={logo.src} width={32} />
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
                      <Image alt={logo.alt} height={32} src={logo.src} width={32} />
                    </a>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 p-4">
                  <Accordion collapsible className="flex w-full flex-col gap-4" type="single">
                    {menu.map((item) => renderMobileMenuItem(item, badgeFor(item)))}
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
                      <div className="flex justify-center">
                        <Button
                          asChild
                          className="flex py-1.5 px-2 gap-3 items-center"
                          size="expand"
                          variant="ghost"
                        >
                          <Link href="/settings">
                            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                              <Bars3Icon className="size-4" />
                            </div>
                            <div className="flex flex-col gap-0.5 leading-none">
                              <span>{session.user.name || 'No Name'}</span>
                              <span className="font-mono text-sm">{session.user.email}</span>
                            </div>
                          </Link>
                        </Button>
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
