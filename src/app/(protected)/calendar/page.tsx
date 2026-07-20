'use client';
import { useTranslations } from 'next-intl';
import { TopBar } from '@/components/TopBar';
import { CalendarInterviews } from '@/features/calendar/components/calendar-interviews';

export default function CalendarPage() {
  const t = useTranslations('pages');
  return (
    <div className="h-full">
      <TopBar />

      <main className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">{t('calendarTitle')}</h1>
          <p className="text-neutral-600 mt-2">
            {t('calendarDescription')}
          </p>
        </div>

        <CalendarInterviews />
      </main>
    </div>
  );
}
