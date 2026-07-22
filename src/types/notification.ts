export type NotificationType = 'APPLICATION_STATUS_CHANGED' | 'NEW_APPLICATION' | 'INTERVIEW_SCHEDULED';

export type NotificationMetadata =
  | { kind: 'NEW_APPLICATION'; candidateName: string; vacancyTitle: string; company: string | null }
  | { kind: 'APPLICATION_STATUS_CHANGED'; status: string; vacancyTitle: string; company: string | null }
  | { kind: 'INTERVIEW_SCHEDULED'; vacancyTitle: string; company: string | null; interviewDate: string; interviewTime: string; rescheduled: boolean };

export type NotificationTranslationKey =
  | 'newApplicationTitle'
  | 'newApplicationMessage'
  | 'statusChangedTitle'
  | 'statusChangedMessage'
  | 'interviewScheduledTitle'
  | 'interviewScheduledMessage'
  | 'interviewRescheduledTitle'
  | 'interviewRescheduledMessage';

export type NotificationActionKey = 'viewCandidate' | 'viewApplication' | 'openCalendar';

export type NotificationDto = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  applicationId: string | null;
  vacancyId: string | null;
  titleKey: NotificationTranslationKey | null;
  messageKey: NotificationTranslationKey | null;
  params: Record<string, string>;
  action: { href: string; labelKey: NotificationActionKey } | null;
};
