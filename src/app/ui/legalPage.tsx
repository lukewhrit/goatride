import type { JSX, ReactNode } from 'react';

export const CONTACT_EMAIL = 'support@goatride.app';

export const LEGAL_EFFECTIVE_DATE = 'October 19, 2026';

/** Shared layout for the terms of service and privacy policy. */
export const LegalPage = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): JSX.Element => (
  <main className="mx-auto max-w-4xl px-6 py-10 space-y-6 leading-relaxed [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1">
    <header className="space-y-1">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground">Effective {LEGAL_EFFECTIVE_DATE}</p>
    </header>
    {children}
  </main>
);
