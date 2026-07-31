'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  SocialAuthButtons,
  type SocialAuthProvider,
} from '@/features/auth/components/social-auth-buttons';

type Account = { provider: SocialAuthProvider; createdAt: string };
type AccountsResponse = { accounts: Account[]; hasPassword: boolean };

const SOCIAL_AUTH_PROVIDERS = ['google', 'github'] as const;

export function ConnectedAccounts() {
  const t = useTranslations('authSecurity');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch('/api/auth/accounts');
        if (!response.ok) throw new Error('Load failed');
        const data: AccountsResponse = await response.json();
        if (!active) return;
        setAccounts(data.accounts);
        setHasPassword(data.hasPassword);
        if (new URLSearchParams(window.location.search).has('accountConnected')) {
          setMessage(t('connected'));
        }
      } catch {
        if (active) setMessage(t('connectFailed'));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [t]);

  const disconnect = async (provider: SocialAuthProvider) => {
    setMessage('');
    try {
      const response = await fetch(`/api/auth/accounts/${provider}`, { method: 'DELETE' });
      if (response.ok) {
        setAccounts((current) => current.filter((account) => account.provider !== provider));
        setMessage(t('disconnected'));
        return;
      }
      const data: { message?: string } = await response.json();
      setMessage(data.message?.includes('last') ? t('lastMethod') : t('disconnectFailed'));
    } catch {
      setMessage(t('disconnectFailed'));
    }
  };

  if (loading) return <div className="mt-4 h-20 animate-pulse rounded-lg bg-neutral-100" />;

  const availableProviders = SOCIAL_AUTH_PROVIDERS.filter(
    (provider) => !accounts.some((account) => account.provider === provider),
  );

  return (
    <section className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-neutral-900">{t('connectedAccounts')}</h2>
      <p className="mt-1 text-sm text-neutral-600">{t('connectedDescription')}</p>
      <div className="mt-5 space-y-3">
        {hasPassword && (
          <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-4">
            <span className="font-medium text-neutral-800">{t('passwordMethod')}</span>
            <span className="text-sm text-green-700">{t('connected')}</span>
          </div>
        )}
        {accounts.map((account) => (
          <div key={account.provider} className="flex items-center justify-between rounded-lg border border-neutral-200 p-4">
            <span className="flex items-center gap-2 font-medium capitalize text-neutral-800">
              <span
                aria-hidden="true"
                className={account.provider === 'github' ? 'font-bold text-neutral-900' : 'font-bold text-blue-600'}
              >
                {account.provider === 'github' ? 'GH' : 'G'}
              </span>
              {account.provider}
            </span>
            <button
              type="button"
              onClick={() => void disconnect(account.provider)}
              aria-label={`${t('disconnect')} ${account.provider}`}
              className="text-sm font-medium text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {t('disconnect')}
            </button>
          </div>
        ))}
      </div>
      {availableProviders.length > 0 && (
        <div className="mt-5">
          <SocialAuthButtons mode="connect" providers={availableProviders} />
        </div>
      )}
      {message && <p role="status" className="mt-4 text-sm text-neutral-700">{message}</p>}
    </section>
  );
}
