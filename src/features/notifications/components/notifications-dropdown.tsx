'use client';

import { Check, ExternalLink, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { enUS, pl, ru } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import { useNotifications } from '@/hooks/use-notifications';
import { useNotificationPresentation } from '@/features/notifications/hooks/use-notification-presentation';
import type { AppLocale } from '@/i18n/config';

const dateLocales = { en: enUS, pl, ru };

export function NotificationsDropdown({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead, isMarkingAll } = useNotifications();
  const locale = useLocale() as AppLocale;
  const t = useTranslations('notifications');
  const present = useNotificationPresentation();
  const router = useRouter();

  if (!isOpen) return null;

  const openNotification = async (id: string, href: string | undefined) => {
    await markAsRead(id);
    if (href) {
      onClose();
      router.push(href);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute right-0 z-40 mt-2 w-[calc(100vw-2rem)] max-w-96 rounded-xl border border-neutral-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 p-4">
          <h3 className="font-semibold text-neutral-900">{t('title')}</h3>
          {unreadCount > 0 && (
            <button disabled={isMarkingAll} onClick={() => void markAllAsRead()} className="text-xs font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50">
              {isMarkingAll ? t('markingAll') : t('markAll')}
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? <div className="p-8 text-center text-sm text-neutral-500">{t('emptyYet')}</div> : notifications.slice(0, 8).map((notification) => {
            const content = present(notification);
            return (
              <div key={notification.id} role={notification.action ? 'link' : undefined} tabIndex={notification.action ? 0 : undefined} onClick={() => void openNotification(notification.id, notification.action?.href)} onKeyDown={(event) => { if (notification.action && (event.key === 'Enter' || event.key === ' ')) void openNotification(notification.id, notification.action.href); }} className={`flex cursor-pointer gap-3 border-b border-neutral-100 p-4 transition-colors hover:bg-neutral-50 ${notification.isRead ? '' : 'bg-primary-50'}`}>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-neutral-900">{content.title}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-neutral-600">{content.message}</p>
                  <p className="mt-2 text-xs text-neutral-500">{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: dateLocales[locale] })}</p>
                  {notification.action && <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary-600">{t(notification.action.labelKey)} <ExternalLink size={12} /></span>}
                </div>
                <div className="flex shrink-0 items-start gap-1">
                  {!notification.isRead && <button onClick={(event) => { event.stopPropagation(); void markAsRead(notification.id); }} className="rounded p-1 hover:bg-white" aria-label={t('markRead')}><Check size={16} className="text-primary-600" /></button>}
                  <button onClick={(event) => { event.stopPropagation(); void deleteNotification(notification.id); }} className="rounded p-1 hover:bg-red-50" aria-label={t('delete')}><X size={16} className="text-neutral-400 hover:text-red-500" /></button>
                </div>
              </div>
            );
          })}
        </div>
        {notifications.length > 0 && <div className="border-t border-neutral-200 p-3 text-center"><Link href="/notifications" onClick={onClose} className="text-sm font-medium text-primary-600 hover:text-primary-700">{t('viewAll')}</Link></div>}
      </div>
    </>
  );
}
