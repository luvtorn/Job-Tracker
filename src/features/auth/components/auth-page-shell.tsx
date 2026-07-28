'use client';

import type { ReactNode } from 'react';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { AuthLogo } from '@/features/auth/components/auth-logo';

export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-primary-50 to-neutral-50 px-4 py-12">
      <div className="absolute right-4 top-4"><LanguageSwitcher /></div>
      <div className="w-full max-w-md">
        <AuthLogo />
        {children}
      </div>
    </div>
  );
}
