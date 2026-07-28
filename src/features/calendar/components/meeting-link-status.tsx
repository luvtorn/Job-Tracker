'use client';

import { useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Props = {
  eventId?: string;
  meetingUrl?: string | null;
  syncState?: 'NOT_REQUIRED' | 'PENDING' | 'SYNCED' | 'FAILED';
  canRetry?: boolean;
};

export function MeetingLinkStatus({ eventId, meetingUrl, syncState, canRetry = false }: Props) {
  const t = useTranslations('calendarIntegration');
  const [retrying, setRetrying] = useState(false);
  const [retryFailed, setRetryFailed] = useState(false);

  const retry = async () => {
    if (!eventId) return;
    setRetrying(true);
    setRetryFailed(false);
    try {
      const response = await fetch('/api/integrations/google-calendar/sync/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      if (!response.ok) throw new Error('Retry failed');
      window.location.reload();
    } catch {
      setRetryFailed(true);
    } finally {
      setRetrying(false);
    }
  };

  if (meetingUrl) {
    return (
      <a
        href={meetingUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800"
      >
        {t('openMeet')} <ExternalLink size={14} aria-hidden="true" />
      </a>
    );
  }
  if (syncState === 'PENDING') return <p className="text-xs text-amber-700">{t('syncPending')}</p>;
  if (syncState !== 'FAILED') return null;
  return (
    <div className="space-y-2">
      <p className="text-xs text-red-700">{t('syncFailed')}</p>
      {canRetry && eventId && (
        <button
          type="button"
          onClick={() => void retry()}
          disabled={retrying}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 disabled:opacity-60"
        >
          <RefreshCw size={13} className={retrying ? 'animate-spin' : ''} aria-hidden="true" />
          {retrying ? t('retrying') : t('retry')}
        </button>
      )}
      {retryFailed && <p role="alert" className="text-xs text-red-700">{t('syncFailed')}</p>}
    </div>
  );
}
