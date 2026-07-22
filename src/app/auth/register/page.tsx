'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RoleSelection } from '@/features/auth/components/role-selection';
import { RegisterForm, type RegisterFormData } from '@/features/auth/components/register-form';
import { AuthLogo } from '@/features/auth/components/auth-logo';
import type { UserRole } from '@/types/auth';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export default function RegisterPage() {
  const [step, setStep] = useState<'role' | 'form'>('role');
  const [role, setRole] = useState<UserRole>('SEEKER');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const t = useTranslations('auth');

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep('form');
  };

  const handleSubmit = async (data: RegisterFormData) => {
    setError('');

    if (data.password !== data.confirmPassword) {
      setError(t('passwordsMismatch'));
      return;
    }

    if (data.password.length < 8) {
      setError(t('atLeastEight'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          role,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          setError(t('registrationFailed'));
        } else {
          setError(t('registrationRetry'));
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
        <AuthLogo />

        {step === 'role' && <RoleSelection onSelect={handleRoleSelect} />}

        {step === 'form' && (
          <>
            <RegisterForm
              role={role}
              onBack={() => setStep('role')}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
            />

            <p className="text-center text-sm text-neutral-600 mt-6">
              {t('alreadyAccount')}{' '}
              <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
                {t('signIn')}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
