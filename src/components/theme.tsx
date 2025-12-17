'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

import type { ComponentProps, JSX } from 'react';

const ThemeProvider = ({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>): JSX.Element => (
  <NextThemesProvider {...props}>{children}</NextThemesProvider>
);

export default ThemeProvider;
