import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';

import type { JSX } from 'react';

import type { NavbarProps } from './navbar';

const Footer = ({ logo, menu }: NavbarProps): JSX.Element => (
  <footer className="border-t-1 px-40 py-10">
    <div className="grid grid-cols-2">
      <div>
        <a className="flex items-center gap-2 mb-3" href={logo.url}>
          <img alt={logo.alt} className="max-h-8 dark:invert" src={logo.src} />
          <span className="text-lg font-semibold tracking-tighter">{logo.title}</span>
        </a>
        <p>© {new Date().getFullYear()} Some Company Name, All Rights Reserved.</p>
      </div>
      <div className="flex flex-col align-middle">
        <NavigationMenu>
          <NavigationMenuList className="flex-wrap">
            {menu.map((item) => (
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
