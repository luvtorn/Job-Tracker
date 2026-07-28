'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm, type LoginFormData } from '@/features/auth/components/login-form';
import { AuthLogo } from '@/features/auth/components/auth-logo';
import { useAuth } from '@/features/auth/context/auth-context';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { SocialAuthButtons } from '@/features/auth/components/social-auth-buttons';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isSessionLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const t = useTranslations('auth');
  const security = useTranslations('authSecurity');
  const privacy = useTranslations('privacy');

  useEffect(() => {
    if (isSessionLoading || !user) return;
    router.replace(user.emailVerified ? '/dashboard' : '/auth/verify-email');
  }, [isSessionLoading, router, user]);

  const handleSubmit = async (data: LoginFormData) => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          setError(t('loginFailed'));
        } else {
          setError(t('loginRetry'));
        }
        return;
      }

      window.location.href = '/dashboard';
    } catch {
      setError(t('unexpected'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-neutral-50 flex items-center justify-center px-4"><div className="absolute right-4 top-4"><LanguageSwitcher /></div>
      <div className="w-full max-w-md">
        <AuthLogo subtitle={t('tagline')} />

        <LoginForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error || (searchParams.has('oauthError') ? security('oauthFailed') : '')}
        />
        <div className="mt-6"><SocialAuthButtons /></div>

        <div className="text-center mt-6">
          <Link
            href="/auth/register"
            className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-2"
          >
            {t('createAccount')}
          </Link>
        </div>

        <p className="text-center text-sm text-neutral-600 mt-6">
          {t('terms')}{' '}
          <Link href="/privacy" className="font-medium text-primary-700 hover:text-primary-800">
            {privacy('link')}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
