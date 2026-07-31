'use client';

import { FormEvent, useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  Loader2,
  Mail,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

type Props = {
  email: string;
  initialFirstName: string;
  initialLastName: string;
};

type RegistrationRole = 'SEEKER' | 'RECRUITER';

export function CompleteOAuthRegistrationCard({
  email,
  initialFirstName,
  initialLastName,
}: Props) {
  const t = useTranslations('authSecurity');
  const auth = useTranslations('auth');
  const [role, setRole] = useState<RegistrationRole>('SEEKER');
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
          role,
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
    <div className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-xl shadow-primary-900/5">
      <div className="h-1.5 bg-gradient-to-r from-primary-500 via-primary-600 to-blue-500" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 ring-1 ring-primary-100">
            <ShieldCheck size={25} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              {t('completeTitle')}
            </h1>
            <p className="mt-2 max-w-xl leading-relaxed text-neutral-600">
              {t('completeDescription')}
            </p>
          </div>
        </div>

        <div className="mt-6 flex min-w-0 items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
          <Mail size={18} className="shrink-0 text-neutral-500" aria-hidden="true" />
          <span className="min-w-0 truncate text-sm font-medium text-neutral-700">{email}</span>
        </div>

        <form onSubmit={submit} className="mt-7 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-neutral-700">
              {auth('firstName')}
              <input
                name="firstName"
                autoComplete="given-name"
                defaultValue={initialFirstName}
                required
                maxLength={100}
                className="mt-2 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-3 font-normal text-neutral-900 outline-none transition hover:border-neutral-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              />
            </label>
            <label className="text-sm font-semibold text-neutral-700">
              {auth('lastName')}
              <input
                name="lastName"
                autoComplete="family-name"
                defaultValue={initialLastName}
                required
                maxLength={100}
                className="mt-2 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-3 font-normal text-neutral-900 outline-none transition hover:border-neutral-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              />
            </label>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-neutral-800">{auth('who')}</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(['SEEKER', 'RECRUITER'] as const).map((item) => {
                const selected = role === item;
                const Icon = item === 'SEEKER' ? Search : BriefcaseBusiness;

                return (
                  <label
                    key={item}
                    className={`relative flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition focus-within:ring-4 focus-within:ring-primary-100 ${
                      selected
                        ? 'border-primary-500 bg-primary-50/70 shadow-sm'
                        : 'border-neutral-200 bg-white hover:border-primary-200 hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={item}
                      checked={selected}
                      onChange={() => setRole(item)}
                      className="sr-only"
                    />
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        selected ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block font-semibold text-neutral-900">
                        {item === 'SEEKER' ? auth('seeker') : auth('recruiter')}
                      </span>
                      <span className="mt-1 block text-sm leading-snug text-neutral-600">
                        {item === 'SEEKER'
                          ? auth('seekerDescription')
                          : auth('recruiterDescription')}
                      </span>
                    </span>
                    <span
                      className={`absolute right-3 top-3 h-2.5 w-2.5 rounded-full ${
                        selected ? 'bg-primary-600 ring-4 ring-primary-100' : 'bg-neutral-200'
                      }`}
                      aria-hidden="true"
                    />
                  </label>
                );
              })}
            </div>
          </fieldset>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-primary-600/20 transition hover:bg-primary-700 hover:shadow-primary-600/30 focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                {t('completing')}
              </>
            ) : (
              <>
                {t('completeAction')}
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
