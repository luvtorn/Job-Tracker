'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { locales, type AppLocale } from '@/i18n/config';

const labels: Record<AppLocale, string> = { pl: 'PL', ru: 'RU', en: 'ENG' };

export function LanguageSwitcher({ expanded = false }: { expanded?: boolean }) {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const t = useTranslations('language');
  const { showToast } = useToast();
  const [pendingLocale, setPendingLocale] = useState<AppLocale | null>(null);

  const changeLocale = async (nextLocale: AppLocale) => {
    if (nextLocale === locale || pendingLocale) return;
    setPendingLocale(nextLocale);
    try {
      const response = await fetch('/api/preferences/locale', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale: nextLocale }) });
      if (!response.ok) throw new Error(t('failed'));
      showToast(t('changed'), 'success');
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('failed'), 'error');
    } finally { setPendingLocale(null); }
  };

  return <div className={expanded ? 'space-y-3' : 'flex items-center gap-1'} aria-label={t('label')}>
    {expanded && <div className="flex items-center gap-2 text-sm font-medium text-neutral-700"><Languages size={18} />{t('label')}</div>}
    <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-1 shadow-sm">{locales.map((item) => <button key={item} type="button" disabled={Boolean(pendingLocale)} onClick={() => void changeLocale(item)} aria-pressed={locale === item} className={`min-w-10 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${locale === item ? 'bg-primary-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}>{pendingLocale === item ? <Loader2 size={14} className="mx-auto animate-spin" /> : labels[item]}</button>)}</div>
  </div>;
}
