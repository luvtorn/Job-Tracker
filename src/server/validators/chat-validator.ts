import { z } from 'zod';

export const chatsQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
}).strict();

export const messagesQuerySchema = z.object({
  before: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
}).strict();

export const sendMessageSchema = z.object({
  clientMessageId: z.string().uuid(),
  content: z.string().trim().min(1).max(2000),
}).strict();

export const markMessagesReadSchema = z.object({
  lastMessageId: z.string().uuid(),
}).strict();

export const chatNotificationPreferencesSchema = z.object({
  chatEmailNotifications: z.boolean(),
}).strict();

export type ChatsQueryInput = z.infer<typeof chatsQuerySchema>;
export type MessagesQueryInput = z.infer<typeof messagesQuerySchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
