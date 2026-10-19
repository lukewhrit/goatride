import Image from 'next/image';

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';

import type { JSX } from 'react';

import type { NavbarProps } from './navbar';

// Footer-only links, on top of the navbar's menu
const extraLinks = [
  { title: 'Settings', url: '/settings' },
  { title: 'Terms of Service', url: '/terms' },
  { title: 'Privacy Policy', url: '/privacy' },
];

const Footer = ({ logo, menu }: NavbarProps): JSX.Element => (
  <footer className="border-t px-5 lg:px-40 py-10">
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-0">
      <div>
        <a className="flex items-center gap-2 mb-3" href={logo.url}>
          <Image
            preload
            alt={logo.alt}
            className="h-8 w-auto"
            height={32}
            src={logo.src}
            width={32}
          />
          <span className="text-lg font-semibold tracking-tighter">{logo.title}</span>
        </a>
        <p className="text-muted-foreground">
          © {new Date().getFullYear()} Luke Whritenour. Licensed under the{' '}
          <a
            className="underline underline-offset-4 hover:text-foreground"
            href="https://www.gnu.org/licenses/gpl-3.0.html"
            rel="license noopener noreferrer"
            target="_blank"
          >
            GNU GPL v3.0
          </a>
          .
        </p>
      </div>
      <div className="flex flex-col align-middle">
        <NavigationMenu>
          <NavigationMenuList className="flex-wrap">
            {[...menu, ...extraLinks].map((item) => (
              <NavigationMenuItem key={item.title}>
                <NavigationMenuLink
                  className="bg-background hover:bg-muted hover:text-accent-foreground group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
                  href={item.url}
                >
                  {item.title}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  </footer>
);

export default Footer;
