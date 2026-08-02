import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import {
  chatNotificationPreferencesSchema,
  chatsQuerySchema,
  markMessagesReadSchema,
  messagesQuerySchema,
  sendMessageSchema,
} from './chat-validator';

test('chat validators accept bounded text and strict cursors', () => {
  const messageId = randomUUID();
  assert.deepEqual(sendMessageSchema.parse({ clientMessageId: messageId, content: '  Hello  ' }), { clientMessageId: messageId, content: 'Hello' });
  assert.equal(chatsQuerySchema.parse({}).limit, 20);
  assert.equal(messagesQuerySchema.parse({}).limit, 30);
  assert.equal(markMessagesReadSchema.parse({ lastMessageId: messageId }).lastMessageId, messageId);
});

test('chat validators reject empty, oversized, malformed, and extra input', () => {
  assert.equal(sendMessageSchema.safeParse({ clientMessageId: randomUUID(), content: '   ' }).success, false);
  assert.equal(sendMessageSchema.safeParse({ clientMessageId: randomUUID(), content: 'x'.repeat(2001) }).success, false);
  assert.equal(sendMessageSchema.safeParse({ clientMessageId: 'not-a-uuid', content: 'Hello' }).success, false);
  assert.equal(chatsQuerySchema.safeParse({ limit: 51 }).success, false);
  assert.equal(messagesQuerySchema.safeParse({ before: 'unsafe', limit: 10 }).success, false);
  assert.equal(chatNotificationPreferencesSchema.safeParse({ chatEmailNotifications: true, extra: true }).success, false);
});
