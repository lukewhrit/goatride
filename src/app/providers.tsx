'use client';

import { createContext, useContext } from 'react';

import ThemeProvider from '@/components/theme';
import { Toaster } from '@/components/ui/sonner';
import { useSession } from '@/lib/auth-client';

import type { User } from 'better-auth';
import type { JSX, ReactNode } from 'react';

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

/*
 * Client-only app state (session context, theme, toasts). Kept out of the root layout so the layout
 * and anything it renders directly can stay server components.
 */
const Providers = ({ children }: { children: ReactNode }): JSX.Element => {
  const { data: session } = useSession();

  return (
    <userCtx.Provider value={session as UserSession | undefined}>
      <ThemeProvider disableTransitionOnChange enableSystem attribute="class" defaultTheme="system">
        <Toaster closeButton position="top-center" />
        {children}
      </ThemeProvider>
    </userCtx.Provider>
  );
};

export default Providers;
