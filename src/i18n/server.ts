import 'server-only';
import { cookies, headers } from 'next/headers';
import { LOCALE_COOKIE, resolveLocale } from './config';

export const getRequestLocale = async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  return resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value, headerStore.get('accept-language'));
};
