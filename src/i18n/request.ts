import { getRequestConfig } from 'next-intl/server';
import { messages } from './messages';
import { getRequestLocale } from './server';

export default getRequestConfig(async () => {
  const locale = await getRequestLocale();
  return { locale, messages: messages[locale], timeZone: 'Europe/Warsaw' };
});
