'use client';

import { useCallback, useEffect, useState } from 'react';
import { Laptop, Loader2, Smartphone } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { z } from 'zod';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/components/ui/toast';

const sessionSchema = z.object({
  id: z.string().uuid(),
  browser: z.enum(['EDGE', 'CHROME', 'FIREFOX', 'SAFARI', 'UNKNOWN']),
  platform: z.enum(['WINDOWS', 'MACOS', 'IOS', 'ANDROID', 'LINUX', 'UNKNOWN']),
  deviceType: z.enum(['DESKTOP', 'MOBILE']),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  isCurrent: z.boolean(),
});
const sessionsResponseSchema = z.object({ success: z.literal(true), sessions: z.array(sessionSchema) });
type Session = z.infer<typeof sessionSchema>;

export function ActiveSessions({ reloadKey }: { reloadKey: number }) {
  const t = useTranslations('profileSecurity');
  const locale = useLocale();
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selected, setSelected] = useState<Session | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/sessions', { cache: 'no-store' });
      if (!response.ok) throw new Error('Request failed');
      const data = sessionsResponseSchema.parse(await response.json());
      setSessions(data.sessions);
    } catch {
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronizing the view with server-managed sessions.
    void load();
  }, [load, reloadKey]);

  const revoke = async () => {
    if (!selected) return;
    setIsRevoking(true);
    try {
      const response = await fetch(`/api/auth/sessions/${selected.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Request failed');
      const result = z.object({ success: z.literal(true), signedOut: z.boolean() }).parse(await response.json());
      if (result.signedOut) {
        window.location.replace('/auth/login');
        return;
      }
      setSessions((current) => current.filter((session) => session.id !== selected.id));
      setSelected(null);
      showToast(t('sessionRevoked'), 'success');
    } catch {
      showToast(t('sessionRevokeFailed'), 'error');
    } finally {
      setIsRevoking(false);
    }
  };

  const formatDate = (value: string) => new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h3 className="font-semibold text-neutral-900">{t('sessionsTitle')}</h3>
      <p className="mt-1 text-sm text-neutral-600">{t('sessionsDescription')}</p>
      {isLoading ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-neutral-500"><Loader2 size={16} className="animate-spin" />{t('sessionsLoading')}</div>
      ) : loadFailed ? (
        <div className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <p>{t('sessionsLoadFailed')}</p>
          <button type="button" onClick={() => { setIsLoading(true); setLoadFailed(false); void load(); }} className="mt-2 font-semibold underline">{t('tryAgain')}</button>
        </div>
      ) : sessions.length === 0 ? (
        <p className="mt-5 text-sm text-neutral-500">{t('noSessions')}</p>
      ) : (
        <ul className="mt-5 divide-y divide-neutral-100">
          {sessions.map((session) => {
            const DeviceIcon = session.deviceType === 'MOBILE' ? Smartphone : Laptop;
            return (
              <li key={session.id} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
                <span className="rounded-lg bg-neutral-100 p-2 text-neutral-600"><DeviceIcon size={20} /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-neutral-900">{t(`browser${session.browser}`)} · {t(`platform${session.platform}`)}</p>
                  <p className="mt-1 text-xs text-neutral-500">{t('lastActive', { date: formatDate(session.createdAt) })}</p>
                  {session.isCurrent && <span className="mt-2 inline-block rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">{t('currentSession')}</span>}
                </div>
                <button type="button" onClick={() => setSelected(session)} className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500">
                  {t('signOut')}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <ConfirmationDialog isOpen={Boolean(selected)} title={t('revokeTitle')} description={selected?.isCurrent ? t('revokeCurrentDescription') : t('revokeDescription')} confirmLabel={t('signOut')} variant="destructive" isLoading={isRevoking} onConfirm={() => void revoke()} onClose={() => setSelected(null)} />
    </section>
  );
}
