'use client';

/* eslint-disable import-x/order */
import ThemeProvider from '@/components/theme';

import './globals.css';

import Footer from '@/app/ui/footer';
import { Navbar } from '@/app/ui/navbar';
import { Toaster } from '@/components/ui/sonner';

import type { User } from 'better-auth';

import { createContext, useContext } from 'react';

import type { JSX } from 'react';

import type { NavbarProps } from './ui/navbar';

import { useSession } from '@/lib/auth-client';

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

const navItems: NavbarProps = {
  logo: {
    url: '/',
    src: 'https://upload.wikimedia.org/wikipedia/en/4/49/WPI_Engineers_primary_logo.svg',
    alt: 'logo',
    title: 'GoatRide',
  },
  menu: [
    { title: 'Home', url: '/' },
    { title: 'Rides', url: '/posts' },
  ],
  auth: {
    signin: { title: 'Sign in', url: '/sign-in' },
    signup: { title: 'Sign up', url: '/sign-up' },
  },
};

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>): JSX.Element => {
  const { data: session } = useSession();

  return (
    <html suppressHydrationWarning lang="en">
      <body className="font-sans antialiased">
        <userCtx.Provider value={session as UserSession | undefined}>
          <ThemeProvider
            disableTransitionOnChange
            enableSystem
            attribute="class"
            defaultTheme="system"
          >
            <Toaster closeButton position="top-center" />
            <Navbar auth={navItems.auth} logo={navItems.logo} menu={navItems.menu} />
            <div>{children}</div>
            <Footer auth={navItems.auth} logo={navItems.logo} menu={navItems.menu} />
          </ThemeProvider>
        </userCtx.Provider>
      </body>
    </html>
  );
};

export default RootLayout;
