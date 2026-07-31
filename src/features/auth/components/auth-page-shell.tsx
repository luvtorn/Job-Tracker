'use client';

import type { ReactNode } from 'react';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { AuthLogo } from '@/features/auth/components/auth-logo';

type AuthPageShellProps = {
  children: ReactNode;
  wide?: boolean;
};

export function AuthPageShell({ children, wide = false }: AuthPageShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-50 via-primary-50 to-neutral-50 px-4 py-20 sm:px-6">
      <div aria-hidden="true" className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-primary-200/30 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="absolute right-4 top-4 z-10"><LanguageSwitcher /></div>
      <div className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <AuthLogo />
        {children}
      </div>
    </div>
  );
}
