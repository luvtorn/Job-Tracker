'use client';

import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/features/auth/context/auth-context';
import Link from 'next/link';

type ConnectionStatus =
  | { connected: false }
  | { connected: true; email: string };

export function GoogleCalendarIntegration() {
  const t = useTranslations('calendarIntegration');
  const privacy = useTranslations('privacy');
  const { user } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user?.role !== 'RECRUITER') {
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const response = await fetch('/api/integrations/google-calendar');
        if (!response.ok) throw new Error('Status failed');
        const data: ConnectionStatus = await response.json();
        if (!active) return;
        setStatus(data);
        const query = new URLSearchParams(window.location.search);
        if (query.has('calendarConnected')) setMessage(t('connected'));
        if (query.has('calendarError')) setMessage(t('connectionFailed'));
      } catch {
        if (active) setMessage(t('connectionFailed'));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [t, user?.role]);

  const disconnect = async () => {
    setDisconnecting(true);
    setMessage('');
    try {
      const response = await fetch('/api/integrations/google-calendar', { method: 'DELETE' });
      if (!response.ok) throw new Error('Disconnect failed');
      setStatus({ connected: false });
      setMessage(t('disconnected'));
    } catch {
      setMessage(t('disconnectFailed'));
    } finally {
      setDisconnecting(false);
    }
  };

  if (user?.role !== 'RECRUITER') return null;

  return (
    <section id="google-calendar" className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-blue-50 p-2 text-blue-700"><CalendarDays aria-hidden="true" /></div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">{t('title')}</h2>
          <p className="mt-1 text-sm text-neutral-600">{t('description')}</p>
          <Link href="/privacy" className="mt-2 inline-flex text-xs font-semibold text-primary-700 hover:text-primary-800">
            {privacy('link')}
          </Link>
        </div>
      </div>
      {loading ? (
        <div className="mt-5 h-10 animate-pulse rounded-lg bg-neutral-100" />
      ) : (
        <div className="mt-5">
          {status.connected && (
            <p className="mb-4 text-sm font-medium text-green-700">{t('connectedAs', { email: status.email })}</p>
          )}
          <div className="flex flex-wrap gap-3">
            <a
              href="/api/integrations/google-calendar/start"
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {status.connected ? t('reconnect') : t('connect')}
            </a>
            {status.connected && (
              <button
                type="button"
                disabled={disconnecting}
                onClick={() => void disconnect()}
                className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                {t('disconnect')}
              </button>
            )}
          </div>
        </div>
      )}
      {message && <p role="status" className="mt-4 text-sm text-neutral-700">{message}</p>}
    </section>
  );
}
