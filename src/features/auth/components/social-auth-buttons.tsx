'use client';

import { useTranslations } from 'next-intl';

export type SocialAuthProvider = 'google' | 'github';

type SocialAuthButtonsProps = {
  mode?: 'login' | 'connect';
  providers?: readonly SocialAuthProvider[];
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.36l-3.25-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.93A6.02 6.02 0 0 1 6.07 12c0-.67.12-1.32.32-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.55l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.82 1.5l2.88-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden="true">
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.3c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0C14.5 4.2 15.5 4.5 15.5 4.5c.7 1.7.3 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v4.1c0 .4.2.7.8.6A12 12 0 0 0 12 .3Z" />
    </svg>
  );
}

export function SocialAuthButtons({
  mode = 'login',
  providers = ['google', 'github'],
}: SocialAuthButtonsProps) {
  const t = useTranslations('authSecurity');
  const suffix = mode === 'connect' ? '?mode=connect' : '';

  if (providers.length === 0) return null;

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
      <div className={`grid gap-3 ${providers.length > 1 ? 'sm:grid-cols-2' : ''}`}>
        {providers.includes('google') && (
          <a
            href={`/api/auth/oauth/google/start${suffix}`}
            className="flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 font-medium text-neutral-800 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50 focus:outline-none focus:ring-4 focus:ring-primary-100"
          >
            <GoogleIcon />
            {mode === 'connect' ? t('connectGoogle') : t('continueGoogle')}
          </a>
        )}
        {providers.includes('github') && (
          <a
            href={`/api/auth/oauth/github/start${suffix}`}
            className="flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-neutral-900 bg-neutral-900 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-neutral-800 focus:outline-none focus:ring-4 focus:ring-neutral-300"
          >
            <GitHubIcon />
            {mode === 'connect' ? t('connectGithub') : t('continueGithub')}
          </a>
        )}
      </div>
    </div>
  );
}
