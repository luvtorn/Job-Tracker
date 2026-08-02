import type { AppLocale } from '@/i18n/config';
import { locales } from '@/i18n/config';
import { createActionEmailHtml } from '@/server/services/email-template';

const copy: Record<AppLocale, { subject: string; title: string; body: (sender: string, vacancy: string) => string; action: string; footer: string }> = {
  en: { subject: 'Unread message in JobTracker', title: 'You have an unread message', body: (sender, vacancy) => `${sender} sent you a message about ${vacancy}. Open JobTracker to read it.`, action: 'Open conversation', footer: 'The message content is available only after you sign in to JobTracker.' },
  pl: { subject: 'Nieprzeczytana wiadomość w JobTracker', title: 'Masz nieprzeczytaną wiadomość', body: (sender, vacancy) => `${sender} wysłał(a) wiadomość dotyczącą ${vacancy}. Otwórz JobTracker, aby ją przeczytać.`, action: 'Otwórz rozmowę', footer: 'Treść wiadomości jest dostępna dopiero po zalogowaniu do JobTracker.' },
  ru: { subject: 'Непрочитанное сообщение в JobTracker', title: 'У вас есть непрочитанное сообщение', body: (sender, vacancy) => `${sender} отправил(а) вам сообщение по вакансии «${vacancy}». Откройте JobTracker, чтобы прочитать его.`, action: 'Открыть переписку', footer: 'Текст сообщения доступен только после входа в JobTracker.' },
};

const normalizeLocale = (value: string): AppLocale => locales.includes(value as AppLocale) ? value as AppLocale : 'en';

export function buildChatReminderEmail(input: { locale: string; senderName: string; vacancyTitle: string; url: string }) {
  const localized = copy[normalizeLocale(input.locale)];
  return {
    subject: localized.subject,
    html: createActionEmailHtml({ title: localized.title, body: localized.body(input.senderName, input.vacancyTitle), action: localized.action, url: input.url, footer: localized.footer }),
  };
}
