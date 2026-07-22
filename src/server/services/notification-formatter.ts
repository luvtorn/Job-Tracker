import type { Notification } from '@prisma/client';
import { notificationMetadataSchema } from '@/server/validators/notification-validator';
import type { NotificationDto } from '@/types/notification';

export const toNotificationDto = (notification: Notification): NotificationDto => {
  const parsed = notificationMetadataSchema.safeParse(notification.metadata);
  const metadata = parsed.success ? parsed.data : null;
  let titleKey: NotificationDto['titleKey'] = null;
  let messageKey: NotificationDto['messageKey'] = null;
  let params: Record<string, string> = {};
  let action: NotificationDto['action'] = null;

  if (metadata?.kind === 'NEW_APPLICATION') {
    titleKey = 'newApplicationTitle';
    messageKey = 'newApplicationMessage';
    params = { candidate: metadata.candidateName, vacancy: metadata.vacancyTitle, company: metadata.company ?? '' };
    if (notification.applicationId) action = { href: `/candidates/${notification.applicationId}`, labelKey: 'viewCandidate' };
  } else if (metadata?.kind === 'APPLICATION_STATUS_CHANGED') {
    titleKey = 'statusChangedTitle';
    messageKey = 'statusChangedMessage';
    params = { status: metadata.status, vacancy: metadata.vacancyTitle, company: metadata.company ?? '' };
    action = { href: '/applications', labelKey: 'viewApplication' };
  } else if (metadata?.kind === 'INTERVIEW_SCHEDULED') {
    titleKey = metadata.rescheduled ? 'interviewRescheduledTitle' : 'interviewScheduledTitle';
    messageKey = metadata.rescheduled ? 'interviewRescheduledMessage' : 'interviewScheduledMessage';
    params = { vacancy: metadata.vacancyTitle, company: metadata.company ?? '', date: metadata.interviewDate, time: metadata.interviewTime };
    action = { href: '/calendar', labelKey: 'openCalendar' };
  } else if (notification.type === 'NEW_APPLICATION' && notification.applicationId) {
    action = { href: `/candidates/${notification.applicationId}`, labelKey: 'viewCandidate' };
  } else if (notification.type === 'APPLICATION_STATUS_CHANGED') {
    action = { href: '/applications', labelKey: 'viewApplication' };
  } else if (notification.type === 'INTERVIEW_SCHEDULED') {
    action = { href: '/calendar', labelKey: 'openCalendar' };
  }

  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
    applicationId: notification.applicationId,
    vacancyId: notification.vacancyId,
    titleKey,
    messageKey,
    params,
    action,
  };
};
