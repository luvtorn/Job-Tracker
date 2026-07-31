'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useUrlFragmentToken } from '@/features/auth/hooks/use-url-fragment-token';

export function ResetPasswordCard({ token }: { token?: string }) {
  const t = useTranslations('authSecurity');
  const auth = useTranslations('auth');
  const secureToken = useUrlFragmentToken(token);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!secureToken.token) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') ?? '');
    const confirmPassword = String(form.get('confirmPassword') ?? '');
    if (password !== confirmPassword) {
      setError(auth('passwordsMismatch'));
      return;
    }
    if (
      password.length < 8
      || !/[A-Z]/.test(password)
      || !/[a-z]/.test(password)
      || !/[0-9]/.test(password)
    ) {
      setError(auth('passwordRequirements'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: secureToken.token, password }),
      });
      if (!response.ok) throw new Error('Reset failed');
      setSuccess(true);
    } catch {
      setError(t('invalidReset'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-lg">
      <h1 className="text-2xl font-bold text-neutral-900">{t('resetTitle')}</h1>
      <p className="mt-2 text-neutral-600">{success ? t('resetSuccess') : t('resetDescription')}</p>
      {!success && secureToken.token && (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-neutral-700">
            {t('newPassword')}
            <input name="password" type="password" required minLength={8} className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            {auth('confirmPassword')}
            <input name="confirmPassword" type="password" required minLength={8} className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </label>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button disabled={loading} className="w-full rounded-lg bg-primary-600 px-4 py-2.5 font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
            {loading ? t('resetting') : t('resetAction')}
          </button>
        </form>
      )}
      {secureToken.resolved && !secureToken.token && (
        <p role="alert" className="mt-5 text-sm text-red-600">{t('invalidReset')}</p>
      )}
      <Link href="/auth/login" className="mt-6 block text-center text-sm font-medium text-primary-600 hover:text-primary-700">
        {t('backLogin')}
      </Link>
    </div>
  );
}
