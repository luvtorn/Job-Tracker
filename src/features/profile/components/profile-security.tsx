'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { ActiveSessions } from './active-sessions';
import { ChangePasswordForm } from './change-password-form';

const accountsResponseSchema = z.object({
  success: z.literal(true),
  accounts: z.array(z.object({
    provider: z.enum(['google', 'github']),
    createdAt: z.string().datetime(),
  })),
  hasPassword: z.boolean(),
});

export function ProfileSecurity() {
  const t = useTranslations('profileSecurity');
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [sessionsReloadKey, setSessionsReloadKey] = useState(0);

  const loadMethods = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/accounts', { cache: 'no-store' });
      if (!response.ok) throw new Error('Request failed');
      const data = accountsResponseSchema.parse(await response.json());
      setHasPassword(data.hasPassword);
    } catch {
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronizing the view with server-managed sign-in methods.
    void loadMethods();
  }, [loadMethods]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-primary-50 p-2.5 text-primary-600"><ShieldCheck size={22} /></span>
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">{t('title')}</h2>
          <p className="mt-1 text-sm text-neutral-600">{t('description')}</p>
        </div>
      </div>

      {hasPassword === null ? (
        loadFailed ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            <p>{t('methodsLoadFailed')}</p>
            <button type="button" onClick={() => { setLoadFailed(false); void loadMethods(); }} className="mt-2 font-semibold underline">{t('tryAgain')}</button>
          </div>
        ) : <div className="h-52 animate-pulse rounded-xl bg-neutral-100" />
      ) : hasPassword ? (
        <ChangePasswordForm onChanged={() => setSessionsReloadKey((value) => value + 1)} />
      ) : (
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-neutral-900">{t('passwordTitle')}</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-600">{t('passwordUnavailableDescription')}</p>
          <Link href="/auth/forgot-password" className="mt-4 inline-flex rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50">
            {t('resetPassword')}
          </Link>
        </section>
      )}

      <ActiveSessions reloadKey={sessionsReloadKey} />
    </div>
  );
}
