'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RoleSelection } from '@/features/auth/components/role-selection';
import { RegisterForm, type RegisterFormData } from '@/features/auth/components/register-form';
import { AuthLogo } from '@/features/auth/components/auth-logo';
import type { UserRole } from '@/types/auth';

export default function RegisterPage() {
  const [step, setStep] = useState<'role' | 'form'>('role');
  const [role, setRole] = useState<UserRole>('SEEKER');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep('form');
  };

  const handleSubmit = async (data: RegisterFormData) => {
    setError('');

    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (data.password.length < 8) {
      setError('Password must be at least 8 characters');
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
          const responseData = await response.json();
          setError(responseData.message || 'Registration failed');
        } else {
          setError('Registration failed. Please try again.');
        }
        return;
      }

      window.location.href = '/dashboard';
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-neutral-50 flex items-center justify-center px-4">
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
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
