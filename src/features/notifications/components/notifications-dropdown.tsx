'use client';

import { X, Check } from 'lucide-react';
import Link from 'next/link';
import { useNotifications } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { enUS, pl, ru } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import type { AppLocale } from '@/i18n/config';

const dateLocales = { en: enUS, pl, ru };

export function NotificationsDropdown({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { notifications, markAsRead, deleteNotification, markAllAsRead } = useNotifications();
  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const locale = useLocale() as AppLocale;
  const t = useTranslations('notifications');

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-30"
        onClick={onClose}
      />
      <div className="absolute right-0 mt-2 w-96 bg-white border border-neutral-200 rounded-lg shadow-xl z-40">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900">{t('title')}</h3>
          {unreadNotifications.length > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              {t('markAll')}
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-neutral-500">{t('emptyYet')}</p>
            </div>
          ) : (
            notifications.slice(0, 8).map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-neutral-100 hover:bg-neutral-50 transition-colors flex gap-3 ${
                  !notification.isRead ? 'bg-primary-50' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-neutral-900 line-clamp-1">
                        {notification.title}
                      </p>
                      <p className="text-sm text-neutral-600 line-clamp-2 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-neutral-500 mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: dateLocales[locale],
                        })}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="flex-shrink-0 p-1 hover:bg-white rounded transition-colors"
                        title={t('markRead')}
                      >
                        <Check size={16} className="text-primary-600" />
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="flex-shrink-0 p-1 hover:bg-red-50 rounded transition-colors"
                  title={t('delete')}
                >
                  <X size={16} className="text-neutral-400 hover:text-red-500" />
                </button>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-3 border-t border-neutral-200 text-center">
            <Link
              href="/notifications"
              onClick={onClose}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {t('viewAll')}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
