import { badRequest, conflict, notFound } from '@/server/errors/application-error';
import { chatRepository } from '@/server/repositories/chat-repository';
import { notificationRepository } from '@/server/repositories/notification-repository';
import { chatEmailService } from '@/server/services/chat-email-service';
import { toNotificationDto } from '@/server/services/notification-formatter';
import { sseSubscriptionService } from '@/server/services/sse-subscription-service';
import type { ChatMessageDto, ChatSummaryDto, ChatThreadDto } from '@/types/chat';
import type { ChatsQueryInput, MessagesQueryInput, SendMessageInput } from '@/server/validators/chat-validator';

const terminalStatuses = new Set(['ACCEPTED', 'REJECTED', 'WITHDRAWN']);

const toMessageDto = (
  message: {
    id: string;
    clientMessageId: string;
    content: string;
    createdAt: Date;
    senderId: string;
    sender: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null };
  },
  userId: string,
): ChatMessageDto => ({
  id: message.id,
  clientMessageId: message.clientMessageId,
  content: message.content,
  createdAt: message.createdAt.toISOString(),
  sender: message.sender,
  isOwn: message.senderId === userId,
});

const participantFor = <T extends {
  userId: string;
  user: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null };
  vacancy: { recruiterId: string; recruiter: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null } };
}>(application: T, userId: string) => application.userId === userId
  ? application.vacancy.recruiter
  : application.user;

const displayName = (user: { firstName: string | null; lastName: string | null }) =>
  `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'JobTracker user';

export const chatService = {
  async listChats(userId: string, query: ChatsQueryInput) {
    const rows = await chatRepository.findChats(userId, query.cursor, query.limit);
    if (!rows) throw badRequest('Invalid cursor');
    const hasMore = rows.length > query.limit;
    const visible = hasMore ? rows.slice(0, query.limit) : rows;
    const chats = visible.flatMap((state): ChatSummaryDto[] => {
      const message = state.application.messages[0];
      if (!message) return [];
      return [{
        applicationId: state.application.id,
        vacancyTitle: state.application.vacancy.title,
        company: state.application.vacancy.company,
        status: state.application.status,
        participant: participantFor(state.application, userId),
        lastMessage: toMessageDto(message, userId),
        unreadCount: state.unreadCount,
      }];
    });
    return {
      chats,
      nextCursor: hasMore ? chats.at(-1)?.lastMessage.id ?? null : null,
    };
  },

  async getThread(userId: string, applicationId: string, query: MessagesQueryInput): Promise<ChatThreadDto> {
    const application = await chatRepository.findParticipantApplication(applicationId, userId);
    if (!application) throw notFound('Conversation not found');
    const before = query.before
      ? await chatRepository.findMessage(applicationId, query.before)
      : null;
    if (query.before && !before) throw badRequest('Invalid cursor');
    const rows = await chatRepository.findMessages(applicationId, before, query.limit);
    const hasMore = rows.length > query.limit;
    const visibleDescending = hasMore ? rows.slice(0, query.limit) : rows;
    const states = await chatRepository.findChatStates(applicationId);
    const peerId = application.userId === userId ? application.vacancy.recruiterId : application.userId;
    return {
      applicationId,
      vacancyTitle: application.vacancy.title,
      company: application.vacancy.company,
      status: application.status,
      participant: participantFor(application, userId),
      canSend: !terminalStatuses.has(application.status),
      peerLastReadCursor: (() => {
        const message = states.find((state) => state.userId === peerId)?.lastReadMessage;
        return message ? { id: message.id, createdAt: message.createdAt.toISOString() } : null;
      })(),
      messages: visibleDescending.reverse().map((message) => toMessageDto(message, userId)),
      nextCursor: hasMore ? visibleDescending[0]?.id ?? null : null,
    };
  },

  async sendMessage(userId: string, applicationId: string, input: SendMessageInput) {
    const result = await chatRepository.createMessage({ applicationId, senderId: userId, ...input });
    if (result.kind === 'NOT_FOUND') throw notFound('Conversation not found');
    if (result.kind === 'CONFLICT') throw conflict('Message identifier already used');
    if (result.kind === 'READ_ONLY') throw conflict('Conversation is read-only');
    if (result.kind === 'EXISTING') {
      return { message: toMessageDto(result.message, userId), created: false };
    }

    const notification = toNotificationDto(result.notification);
    const unreadCount = await notificationRepository.findUnreadCount(result.recipient.id);
    sseSubscriptionService.notifyUser(result.recipient.id, notification, unreadCount);

    if (result.scheduledEmailAt) {
      try {
        const scheduled = await chatEmailService.scheduleReminder({
          applicationId,
          messageId: result.message.id,
          recipientId: result.recipient.id,
          recipientEmail: result.recipient.email,
          recipientLocale: result.recipient.preferredLocale,
          senderName: displayName(result.sender),
          vacancyTitle: result.application.vacancy.title,
          scheduledAt: result.scheduledEmailAt,
        });
        if (scheduled) {
          const saved = await chatRepository.saveScheduledEmail({
            applicationId,
            userId: result.recipient.id,
            messageId: result.message.id,
            emailId: scheduled.id,
          });
          if (saved.count === 0) await chatEmailService.cancelReminder(scheduled.id);
        }
      } catch {
        console.error('Chat email reminder scheduling failed');
      }
    }

    return { message: toMessageDto(result.message, userId), created: true };
  },

  async markRead(userId: string, applicationId: string, messageId: string) {
    const result = await chatRepository.markRead(applicationId, userId, messageId);
    if (result.kind === 'NOT_FOUND') throw notFound('Conversation not found');
    if (result.kind === 'MESSAGE_NOT_FOUND') throw badRequest('Invalid message');
    if (result.emailIdToCancel) {
      try {
        if (await chatEmailService.cancelReminder(result.emailIdToCancel)) {
          await chatRepository.clearScheduledEmail(applicationId, userId, result.emailIdToCancel);
        }
      } catch {
        console.error('Chat email reminder cancellation failed');
      }
    }
    return result.state.unreadCount;
  },

  async getUnreadCount(userId: string) {
    const result = await chatRepository.getUnreadCount(userId);
    return result._sum.unreadCount ?? 0;
  },
};
