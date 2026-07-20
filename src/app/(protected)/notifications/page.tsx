'use client';
import { useTranslations } from 'next-intl';
import { TopBar } from '@/components/TopBar';
import { NotificationsList } from '@/features/notifications/components/notifications-list';

export default function NotificationsPage() {
  const t = useTranslations('pages');
  return (
    <div className="h-full">
      <TopBar />
      <main className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">{t('notificationsTitle')}</h1>
          <p className="text-neutral-600">{t('notificationsDescription')}</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
          <NotificationsList />
        </div>
      </main>
    </div>
  );
}
