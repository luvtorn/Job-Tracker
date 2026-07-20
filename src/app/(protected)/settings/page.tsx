'use client';

import { useTranslations } from 'next-intl';
import { TopBar } from '@/components/TopBar';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export default function SettingsPage() {
  const t = useTranslations();
  return <div className="min-h-screen bg-neutral-50"><TopBar /><main className="mx-auto max-w-4xl p-6 lg:p-8"><h1 className="text-3xl font-bold text-neutral-900">{t('pages.settingsTitle')}</h1><p className="mt-2 text-neutral-600">{t('pages.settingsDescription')}</p><section className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold text-neutral-900">{t('language.label')}</h2><p className="mt-1 text-sm text-neutral-600">{t('language.description')}</p><div className="mt-5"><LanguageSwitcher expanded /></div><p className="mt-4 text-xs text-neutral-500">{t('language.detected')}</p></section></main></div>;
}
