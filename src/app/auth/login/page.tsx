'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LoginForm, type LoginFormData } from '@/features/auth/components/login-form';
import { AuthLogo } from '@/features/auth/components/auth-logo';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
          const responseData = await response.json();
          setError(responseData.message || 'Login failed');
        } else {
          setError('Login failed. Please try again.');
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
        <AuthLogo subtitle="Track your job journey" />

        <LoginForm onSubmit={handleSubmit} isLoading={isLoading} error={error} />

        <div className="text-center mt-6">
          <Link
            href="/auth/register"
            className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-2"
          >
            Create an account
          </Link>
        </div>

        <p className="text-center text-sm text-neutral-600 mt-6">
          By signing in, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
