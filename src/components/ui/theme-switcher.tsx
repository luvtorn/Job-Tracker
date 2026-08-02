'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/features/theme/theme-context';
import {
  getNextThemePreference,
  themePreferences,
} from '@/features/theme/theme';

const icons = { system: Monitor, light: Sun, dark: Moon } as const;

export function ThemeSwitcher({ expanded = false }: { expanded?: boolean }) {
  const t = useTranslations('theme');
  const { preference, setTheme } = useTheme();

  if (!expanded) {
    const Icon = icons[preference];
    const next = getNextThemePreference(preference);
    return <button type="button" onClick={() => setTheme(next)} aria-label={t('change', { current: t(preference), next: t(next) })} title={t(preference)} className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-300"><Icon size={20} aria-hidden="true" /></button>;
  }

  return <div className="space-y-3"><p className="text-sm font-medium text-neutral-700">{t('label')}</p><div role="group" aria-label={t('label')} className="grid grid-cols-3 gap-2">{themePreferences.map((item) => {
    const Icon = icons[item];
    return <button key={item} type="button" aria-pressed={preference === item} onClick={() => setTheme(item)} className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-300 ${preference === item ? 'border-primary-600 bg-primary-600 text-white' : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100'}`}><Icon size={17} aria-hidden="true" />{t(item)}</button>;
  })}</div><p className="text-xs text-neutral-500">{t('description')}</p></div>;
}
