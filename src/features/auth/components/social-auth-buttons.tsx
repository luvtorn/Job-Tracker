'use client';

import { useTranslations } from 'next-intl';

export function SocialAuthButtons({ mode = 'login' }: { mode?: 'login' | 'connect' }) {
  const t = useTranslations('authSecurity');
  const suffix = mode === 'connect' ? '?mode=connect' : '';

  return (
    <div className="space-y-3">
      {mode === 'login' && (
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-neutral-200" />
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {t('orContinue')}
          </span>
          <div className="h-px flex-1 bg-neutral-200" />
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href={`/api/auth/oauth/google/start${suffix}`}
          className="flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 font-medium text-neutral-800 transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <span aria-hidden="true" className="text-lg font-bold text-blue-600">G</span>
          {mode === 'connect' ? t('connectGoogle') : t('continueGoogle')}
        </a>
        <a
          href={`/api/auth/oauth/github/start${suffix}`}
          className="flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 font-medium text-neutral-800 transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <span aria-hidden="true" className="font-bold">GH</span>
          {mode === 'connect' ? t('connectGithub') : t('continueGithub')}
        </a>
      </div>
    </div>
  );
}
