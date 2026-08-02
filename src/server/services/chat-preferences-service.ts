import { notFound } from '@/server/errors/application-error';
import { chatRepository } from '@/server/repositories/chat-repository';
import {
  getChatNotificationPreferences,
  updateChatNotificationPreferences,
} from '@/server/repositories/user-repository';
import { chatEmailService } from '@/server/services/chat-email-service';

const cancelScheduledEmails = async (userId: string) => {
  const scheduledEmails = await chatRepository.findScheduledEmails(userId);

  await Promise.all(scheduledEmails.map(async (state) => {
    if (!state.scheduledEmailId) return;

    try {
      const cancelled = await chatEmailService.cancelReminder(state.scheduledEmailId);
      if (!cancelled) return;
      await chatRepository.clearDisabledScheduledEmail(
        state.applicationId,
        userId,
        state.scheduledEmailId,
      );
    } catch {
      console.error('Chat email reminder cancellation failed');
    }
  }));
};

export const chatPreferencesService = {
  async get(userId: string) {
    const preferences = await getChatNotificationPreferences(userId);
    if (!preferences) throw notFound('User not found');
    if (!preferences.chatEmailNotifications) await cancelScheduledEmails(userId);
    return preferences;
  },

  async update(userId: string, chatEmailNotifications: boolean) {
    const preferences = await updateChatNotificationPreferences(userId, chatEmailNotifications);
    if (chatEmailNotifications) return preferences;
    await cancelScheduledEmails(userId);
    return preferences;
  },
};
