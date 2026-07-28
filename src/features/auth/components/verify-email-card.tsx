'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle2, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth, type User } from '@/features/auth/context/auth-context';

type Status = 'waiting' | 'verifying' | 'verified' | 'failed';

export function VerifyEmailCard({
  token,
  deliveryUnavailable = false,
}: {
  token?: string;
  deliveryUnavailable?: boolean;
}) {
  const t = useTranslations('authSecurity');
  const { user, updateUser } = useAuth();
  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'waiting');
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState(deliveryUnavailable ? t('emailUnavailable') : '');

  useEffect(() => {
    if (!token) return;
    let active = true;
    const verify = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (!response.ok) throw new Error('Verification failed');
        const data: { user: User } = await response.json();
        if (!active) return;
        updateUser(data.user);
        setStatus('verified');
      } catch {
        if (active) setStatus('failed');
      }
    };
    void verify();
    return () => { active = false; };
  }, [token, updateUser]);

  const resend = async () => {
    setIsResending(true);
    setMessage('');
    try {
      const response = await fetch('/api/auth/resend-verification', { method: 'POST' });
      const data: { emailSent?: boolean } = await response.json();
      if (!response.ok) throw new Error('Resend failed');
      setMessage(data.emailSent ? t('resendSuccess') : t('emailUnavailable'));
    } catch {
      setMessage(t('verifyFailed'));
    } finally {
      setIsResending(false);
    }
  };

  const verified = status === 'verified' || user?.emailVerified;
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-lg">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600">
        {verified ? <CheckCircle2 size={30} /> : <Mail size={30} />}
      </div>
      <h1 className="text-2xl font-bold text-neutral-900">
        {verified ? t('verifiedTitle') : t('verificationTitle')}
      </h1>
      <p className="mt-3 text-neutral-600">
        {status === 'verifying'
          ? t('verifying')
          : status === 'failed'
            ? t('verifyFailed')
            : verified
              ? t('verifiedDescription')
              : t('verificationDescription', { email: user?.email ?? '' })}
      </p>
      {message && <p role="status" className="mt-4 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700">{message}</p>}
      <div className="mt-6 space-y-3">
        {verified ? (
          <Link href="/dashboard" className="block rounded-lg bg-primary-600 px-4 py-2.5 font-semibold text-white hover:bg-primary-700">
            {t('openDashboard')}
          </Link>
        ) : user ? (
          <button onClick={resend} disabled={isResending} className="w-full rounded-lg bg-primary-600 px-4 py-2.5 font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
            {isResending ? t('resending') : t('resend')}
          </button>
        ) : null}
        <Link href="/auth/login" className="block text-sm font-medium text-primary-600 hover:text-primary-700">
          {t('backLogin')}
        </Link>
      </div>
    </div>
  );
}
