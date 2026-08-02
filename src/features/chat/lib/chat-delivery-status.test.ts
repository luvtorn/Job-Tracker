import assert from 'node:assert/strict';
import test from 'node:test';
import { getChatDeliveryStatus } from '@/features/chat/lib/chat-delivery-status';
import type { ChatMessageDto } from '@/types/chat';

const message = (id: string, createdAt: string): ChatMessageDto => ({
  id,
  clientMessageId: '4e78fe7d-6377-4702-973b-e0a467d95f95',
  content: 'Safe test content',
  createdAt,
  isOwn: true,
  sender: { id: 'sender', firstName: null, lastName: null, avatarUrl: null },
});

test('maps optimistic, persisted, and read messages to delivery states', () => {
  const createdAt = '2026-08-02T12:00:00.000Z';
  assert.equal(getChatDeliveryStatus(message('pending-client', createdAt), null), 'sending');
  assert.equal(getChatDeliveryStatus(message('00000000-0000-0000-0000-000000000001', createdAt), null), 'delivered');
  assert.equal(getChatDeliveryStatus(
    message('00000000-0000-0000-0000-000000000001', createdAt),
    { id: '00000000-0000-0000-0000-000000000002', createdAt },
  ), 'read');
});

test('uses the message id to resolve equal timestamp cursors', () => {
  const createdAt = '2026-08-02T12:00:00.000Z';
  const cursor = { id: '00000000-0000-0000-0000-000000000001', createdAt };
  assert.equal(getChatDeliveryStatus(message('00000000-0000-0000-0000-000000000001', createdAt), cursor), 'read');
  assert.equal(getChatDeliveryStatus(message('00000000-0000-0000-0000-000000000002', createdAt), cursor), 'delivered');
});
