'use client';

import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/toast';

export function ChatNotificationPreferences() {
  const t = useTranslations('chatUi');
  const { showToast } = useToast();
  const [enabled, setEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/preferences/notifications', { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error();
      const data = await response.json() as { preferences: { chatEmailNotifications: boolean } };
      setEnabled(data.preferences.chatEmailNotifications);
    }).catch((error) => {
      if (!(error instanceof DOMException && error.name === 'AbortError')) showToast(t('preferencesLoadFailed'), 'error');
    }).finally(() => setIsLoading(false));
    return () => controller.abort();
  }, [showToast, t]);

  const update = async (nextValue: boolean) => {
    const previous = enabled;
    setEnabled(nextValue); setIsSaving(true);
    try {
      const response = await fetch('/api/preferences/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatEmailNotifications: nextValue }) });
      if (!response.ok) throw new Error();
      showToast(t('preferencesSaved'), 'success');
    } catch {
      setEnabled(previous); showToast(t('preferencesSaveFailed'), 'error');
    } finally { setIsSaving(false); }
  };

  return <section className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"><div className="flex gap-3"><div className="rounded-lg bg-primary-50 p-2 text-primary-700"><Mail size={20} /></div><div><h2 className="text-lg font-semibold text-neutral-900">{t('emailTitle')}</h2><p className="mt-1 text-sm text-neutral-600">{t('emailDescription')}</p></div></div><label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-neutral-200 p-4"><span className="font-medium text-neutral-800">{t('emailToggle')}</span><input type="checkbox" checked={enabled} disabled={isLoading || isSaving} onChange={(event) => void update(event.target.checked)} className="h-5 w-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50" /></label></section>;
}
