'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';

type Props = {
  email: string;
  initialFirstName: string;
  initialLastName: string;
};

export function CompleteOAuthRegistrationCard({
  email,
  initialFirstName,
  initialLastName,
}: Props) {
  const t = useTranslations('authSecurity');
  const auth = useTranslations('auth');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/auth/oauth/complete-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.get('firstName'),
          lastName: form.get('lastName'),
          role: form.get('role'),
        }),
      });
      if (!response.ok) throw new Error('Registration failed');
      window.location.replace('/dashboard');
    } catch {
      setError(auth('registrationRetry'));
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-lg">
      <h1 className="text-2xl font-bold text-neutral-900">{t('completeTitle')}</h1>
      <p className="mt-2 text-neutral-600">{t('completeDescription')}</p>
      <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-700">{email}</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-medium text-neutral-700">
            {auth('firstName')}
            <input name="firstName" defaultValue={initialFirstName} required maxLength={100} className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </label>
          <label className="text-sm font-medium text-neutral-700">
            {auth('lastName')}
            <input name="lastName" defaultValue={initialLastName} required maxLength={100} className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </label>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-neutral-700">{auth('who')}</legend>
          <div className="grid grid-cols-2 gap-3">
            {(['SEEKER', 'RECRUITER'] as const).map((role) => (
              <label key={role} className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 p-3 text-sm">
                <input type="radio" name="role" value={role} defaultChecked={role === 'SEEKER'} />
                {role === 'SEEKER' ? auth('seeker') : auth('recruiter')}
              </label>
            ))}
          </div>
        </fieldset>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full rounded-lg bg-primary-600 px-4 py-2.5 font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
          {loading ? t('completing') : t('completeAction')}
        </button>
      </form>
    </div>
  );
}
