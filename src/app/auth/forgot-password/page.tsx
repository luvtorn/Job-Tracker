'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AuthPageShell } from '@/features/auth/components/auth-page-shell';

export default function ForgotPasswordPage() {
  const t = useTranslations('authSecurity');
  const auth = useTranslations('auth');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const email = new FormData(event.currentTarget).get('email');
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error('Request failed');
      setSent(true);
    } catch {
      setError(auth('unexpected'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell>
      <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-neutral-900">{sent ? t('resetSentTitle') : t('forgotTitle')}</h1>
        <p className="mt-2 text-neutral-600">{sent ? t('resetSentDescription') : t('forgotDescription')}</p>
        {!sent && (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-neutral-700">
              {auth('email')}
              <input name="email" type="email" required className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </label>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button disabled={loading} className="w-full rounded-lg bg-primary-600 px-4 py-2.5 font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
              {loading ? t('sending') : t('sendReset')}
            </button>
          </form>
        )}
        <Link href="/auth/login" className="mt-6 block text-center text-sm font-medium text-primary-600 hover:text-primary-700">
          {t('backLogin')}
        </Link>
      </div>
    </AuthPageShell>
  );
}
