export const locales = ['en', 'pl', 'ru'] as const;
export type AppLocale = (typeof locales)[number];

export const DEFAULT_LOCALE: AppLocale = 'en';
export const LOCALE_COOKIE = 'locale';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const isAppLocale = (value: string | null | undefined): value is AppLocale =>
  locales.includes(value as AppLocale);

export const normalizeLocale = (value: string | null | undefined): AppLocale | null => {
  if (!value) return null;
  const language = value.trim().toLowerCase().split(/[-_]/)[0];
  return isAppLocale(language) ? language : null;
};

export const resolveLocale = (cookieLocale?: string | null, acceptLanguage?: string | null): AppLocale => {
  const savedLocale = normalizeLocale(cookieLocale);
  if (savedLocale) return savedLocale;

  for (const entry of acceptLanguage?.split(',') ?? []) {
    const locale = normalizeLocale(entry.split(';')[0]);
    if (locale) return locale;
  }
  return DEFAULT_LOCALE;
};
