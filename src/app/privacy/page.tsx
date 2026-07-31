import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export default async function PrivacyPage() {
  const t = await getTranslations('privacy');
  const sections = [
    ['accountTitle', 'accountBody'],
    ['emailTitle', 'emailBody'],
    ['calendarTitle', 'calendarBody'],
    ['controlTitle', 'controlBody'],
  ] as const;

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex justify-end"><LanguageSwitcher /></div>
        <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-10">
          <h1 className="text-3xl font-bold text-neutral-900">{t('title')}</h1>
          <p className="mt-4 text-neutral-600">{t('intro')}</p>
          <div className="mt-8 space-y-7">
            {sections.map(([title, body]) => (
              <section key={title}>
                <h2 className="text-lg font-semibold text-neutral-900">{t(title)}</h2>
                <p className="mt-2 leading-7 text-neutral-600">{t(body)}</p>
              </section>
            ))}
          </div>
          <Link href="/" className="mt-10 inline-flex font-semibold text-primary-700 hover:text-primary-800">
            {t('back')}
          </Link>
        </article>
      </div>
    </main>
  );
}
