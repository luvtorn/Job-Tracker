import { env } from '@/server/config/env';
import { buildChatReminderEmail } from '@/server/services/chat-email-content';
import { cancelResendEmail, sendResendEmail } from '@/server/services/resend-email-service';

export const chatEmailService = {
  scheduleReminder(input: { applicationId: string; messageId: string; recipientId: string; recipientEmail: string; recipientLocale: string; senderName: string; vacancyTitle: string; scheduledAt: Date }) {
    const url = `${env.appUrl}/messages?applicationId=${encodeURIComponent(input.applicationId)}`;
    const email = buildChatReminderEmail({ locale: input.recipientLocale, senderName: input.senderName, vacancyTitle: input.vacancyTitle, url });
    return sendResendEmail({ to: input.recipientEmail, ...email, scheduledAt: input.scheduledAt, idempotencyKey: `chat-reminder/${input.applicationId}/${input.recipientId}/${input.messageId}` });
  },

  cancelReminder(emailId: string) {
    return cancelResendEmail(emailId);
  },
};
