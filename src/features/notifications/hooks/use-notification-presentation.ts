'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { AppLocale } from '@/i18n/config';
import type { NotificationDto } from '@/types/notification';

const supportedStatuses = ['APPLIED', 'INTERVIEWING', 'OFFER', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'] as const;
type SupportedStatus = typeof supportedStatuses[number];

const isSupportedStatus = (status: string): status is SupportedStatus => supportedStatuses.includes(status as SupportedStatus);

export function useNotificationPresentation() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations('notifications');
  const statusT = useTranslations('statuses');

  return (notification: NotificationDto) => {
    if (!notification.titleKey || !notification.messageKey) {
      return { title: notification.title, message: notification.message };
    }

    const params = { ...notification.params };
    if (!params.company) params.company = '—';
    if (params.status && isSupportedStatus(params.status)) {
      params.status = statusT(params.status.toLowerCase() as Lowercase<SupportedStatus>);
    }
    if (params.date) {
      const date = new Date(`${params.date}T00:00:00`);
      if (!Number.isNaN(date.getTime())) params.date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
    }

    return {
      title: t(notification.titleKey),
      message: t(notification.messageKey, params),
    };
  };
}
