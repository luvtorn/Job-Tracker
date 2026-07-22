'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, ExternalLink, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { enUS, pl, ru } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import { useNotifications } from '@/hooks/use-notifications';
import { useNotificationPresentation } from '@/features/notifications/hooks/use-notification-presentation';
import type { AppLocale } from '@/i18n/config';

const dateLocales = { en: enUS, pl, ru };

export function NotificationsList() {
  const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead, isMarkingAll, isLoading, error } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const locale = useLocale() as AppLocale;
  const t = useTranslations('notifications');
  const present = useNotificationPresentation();
  const router = useRouter();
  const filtered = notifications.filter((notification) => filter === 'all' || (filter === 'unread' ? !notification.isRead : notification.isRead));

  if (isLoading) return <div className="p-8 text-center text-sm text-neutral-500">{t('loading')}</div>;
  if (error && notifications.length === 0) return <div className="p-8 text-center text-sm text-red-500">{error}</div>;

  const openNotification = async (id: string, href: string | undefined) => {
    await markAsRead(id);
    if (href) router.push(href);
  };

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex flex-wrap gap-2">
          {(['all', 'unread', 'read'] as const).map((value) => <button key={value} onClick={() => setFilter(value)} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${filter === value ? 'bg-primary-100 text-primary-700' : 'text-neutral-600 hover:bg-neutral-100'}`}>{value === 'unread' ? t('unread', { count: unreadCount }) : t(value)}</button>)}
        </div>
        {unreadCount > 0 && <button disabled={isMarkingAll} onClick={() => void markAllAsRead()} className="text-left text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50">{isMarkingAll ? t('markingAll') : t('markAll')}</button>}
      </div>
      {filtered.length === 0 ? <div className="p-12 text-center text-sm text-neutral-500">{filter === 'unread' ? t('noUnread') : t('empty')}</div> : filtered.map((notification) => {
        const content = present(notification);
        return (
          <div key={notification.id} className={`flex gap-3 border-b border-neutral-100 p-4 transition-colors hover:bg-neutral-50 sm:gap-4 sm:p-6 ${notification.isRead ? '' : 'bg-primary-50'}`}>
            <button disabled={notification.isRead} onClick={() => void markAsRead(notification.id)} className="shrink-0 self-start rounded p-1 hover:bg-white disabled:cursor-default" aria-label={notification.isRead ? t('alreadyRead') : t('markRead')}>{notification.isRead ? <CheckCircle2 size={20} className="text-neutral-400" /> : <Circle size={20} className="text-primary-600" />}</button>
            <button onClick={() => void openNotification(notification.id, notification.action?.href)} className="min-w-0 flex-1 text-left">
              <h3 className="text-sm font-semibold text-neutral-900">{content.title}</h3>
              <p className="mt-1 text-sm text-neutral-600">{content.message}</p>
              <p className="mt-3 text-xs text-neutral-500">{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: dateLocales[locale] })}</p>
              {notification.action && <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-600">{t(notification.action.labelKey)} <ExternalLink size={14} /></span>}
            </button>
            <button onClick={() => void deleteNotification(notification.id)} className="shrink-0 self-start rounded p-2 hover:bg-red-50" aria-label={t('delete')}><Trash2 size={18} className="text-neutral-400 hover:text-red-500" /></button>
          </div>
        );
      })}
    </div>
  );
}
