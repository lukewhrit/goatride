/* eslint-disable import-x/order */
import './globals.css';

import Footer from '@/app/ui/footer';
import { Navbar } from '@/app/ui/navbar';
import { Analytics } from '@vercel/analytics/next';

import Providers from './providers';

import type { Metadata } from 'next';
import type { JSX } from 'react';

import type { NavbarProps } from './ui/navbar';

export const metadata: Metadata = {
  title: 'GoatRide',
  description: 'Find, share, and join rides with people on your campus.',
};

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
    { title: 'Messages', url: '/messages' },
  ],
  auth: {
    signin: { title: 'Sign in', url: '/sign-in' },
    signup: { title: 'Sign up', url: '/sign-up' },
  },
};

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>): JSX.Element => (
  <html suppressHydrationWarning lang="en">
    <body className="font-sans antialiased">
      <Providers>
        <Navbar auth={navItems.auth} logo={navItems.logo} menu={navItems.menu} />
        <div>{children}</div>
        <Footer auth={navItems.auth} logo={navItems.logo} menu={navItems.menu} />
      </Providers>
      <Analytics />
    </body>
  </html>
);

export default RootLayout;
