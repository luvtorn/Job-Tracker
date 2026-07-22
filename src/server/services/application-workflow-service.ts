import type { ApplicationStatus, User } from '@prisma/client';
import { applicationService } from '@/server/services/application-service';
import { notificationService } from '@/server/services/notification-service';
import { sseSubscriptionService } from '@/server/services/sse-subscription-service';
import type { ScheduleInterviewInput } from '@/server/validators/vacancy-validator';

const statusMessages: Partial<Record<ApplicationStatus, string>> = {
  INTERVIEWING: 'Your application has been moved to the interviewing stage',
  REJECTED: 'Your application has been rejected',
  OFFER: "You've received an offer!",
  ACCEPTED: 'Your application has been accepted',
  WITHDRAWN: 'Your application has been withdrawn',
};

const publishNotification = async (
  userId: string,
  input: Parameters<typeof notificationService.createNotification>[0],
) => {
  try {
    const notification = await notificationService.createNotification(input);
    const unreadCount = await notificationService.getUnreadCount(userId);
    sseSubscriptionService.notifyUser(userId, notification, unreadCount);
  } catch {
    console.error('Non-critical notification delivery failed');
  }
};

export const applicationWorkflowService = {
  async create(user: Pick<User, 'id' | 'role' | 'firstName' | 'lastName' | 'email'>, vacancyId: string) {
    const result = await applicationService.create(user, vacancyId);
    const candidateName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;
    await publishNotification(result.vacancy.recruiterId, {
      type: 'NEW_APPLICATION',
      userId: result.vacancy.recruiterId,
      title: 'New Application',
      message: `${candidateName} applied for "${result.vacancy.title}" at ${result.vacancy.company ?? ''}`,
      metadata: {
        kind: 'NEW_APPLICATION',
        candidateName,
        vacancyTitle: result.vacancy.title,
        company: result.vacancy.company,
      },
      applicationId: result.application.id,
      vacancyId: result.vacancy.id,
    });
    return result.application;
  },

  async updateStatus(recruiterId: string, applicationId: string, status: ApplicationStatus) {
    const { application, existing } = await applicationService.updateStatus(recruiterId, applicationId, status);
    const statusMessage = statusMessages[status] ?? `Your application status has been updated to ${status}`;
    await publishNotification(existing.userId, {
      type: 'APPLICATION_STATUS_CHANGED',
      userId: existing.userId,
      title: `Application Status: ${status}`,
      message: `${statusMessage} for "${existing.vacancy.title}" at ${existing.vacancy.company ?? ''}`,
      metadata: {
        kind: 'APPLICATION_STATUS_CHANGED',
        status,
        vacancyTitle: existing.vacancy.title,
        company: existing.vacancy.company,
      },
      applicationId: existing.id,
      vacancyId: existing.vacancyId,
    });
    return application;
  },

  async scheduleInterview(recruiterId: string, applicationId: string, data: ScheduleInterviewInput) {
    const { application, wasScheduled } = await applicationService.scheduleInterview(recruiterId, applicationId, data);
    await publishNotification(application.userId, {
      type: 'INTERVIEW_SCHEDULED',
      userId: application.userId,
      title: wasScheduled ? 'Interview Rescheduled' : 'Interview Scheduled',
      message: `Interview for "${application.vacancy.title}" at ${application.vacancy.company ?? ''} ${wasScheduled ? 'rescheduled to' : 'scheduled for'} ${data.interviewDate} at ${data.interviewTime}`,
      metadata: {
        kind: 'INTERVIEW_SCHEDULED',
        vacancyTitle: application.vacancy.title,
        company: application.vacancy.company,
        interviewDate: data.interviewDate,
        interviewTime: data.interviewTime,
        rescheduled: wasScheduled,
      },
      applicationId: application.id,
      vacancyId: application.vacancyId,
    });
    return application;
  },
};
