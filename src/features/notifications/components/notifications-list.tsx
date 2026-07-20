'use client';

import { useState } from 'react';
import { Trash2, CheckCircle2, Circle } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { enUS, pl, ru } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import type { AppLocale } from '@/i18n/config';

const dateLocales = { en: enUS, pl, ru };

export function NotificationsList() {
  const { notifications, markAsRead, deleteNotification, markAllAsRead, isLoading, error } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const locale = useLocale() as AppLocale;
  const t = useTranslations('notifications');

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-neutral-500">{t('loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-red-500">{t('loadError', { error })}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header with filters */}
      <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-primary-100 text-primary-700'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {t('all')}
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
              filter === 'unread'
                ? 'bg-primary-100 text-primary-700'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {t('unread', { count: unreadCount })}
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
              filter === 'read'
                ? 'bg-primary-100 text-primary-700'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {t('read')}
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {t('markAll')}
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div>
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-neutral-500">
              {filter === 'unread' ? t('noUnread') : t('empty')}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-6 border-b border-neutral-100 hover:bg-neutral-50 transition-colors flex gap-4 ${
                !notification.isRead ? 'bg-primary-50' : ''
              }`}
            >
              <button
                onClick={() => markAsRead(notification.id)}
                className="flex-shrink-0 p-1 hover:bg-white rounded transition-colors"
                title={notification.isRead ? t('alreadyRead') : t('markRead')}
              >
                {notification.isRead ? (
                  <CheckCircle2 size={20} className="text-neutral-400" />
                ) : (
                  <Circle size={20} className="text-primary-600" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">
                      {notification.title}
                    </h3>
                    <p className="text-sm text-neutral-600 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-neutral-500 mt-3">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: dateLocales[locale],
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => deleteNotification(notification.id)}
                className="flex-shrink-0 p-2 hover:bg-red-50 rounded transition-colors"
                title={t('delete')}
              >
                <Trash2 size={18} className="text-neutral-400 hover:text-red-500" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
