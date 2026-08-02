import assert from 'node:assert/strict';
import test from 'node:test';
import { getChatPollingDelay, MAX_CHAT_POLL_MS } from '@/features/chat/lib/chat-polling';

test('chat polling resets to the base interval after a successful request', () => {
  assert.equal(getChatPollingDelay(1_000, 0), 1_000);
});

test('chat polling backs off and remains bounded', () => {
  assert.equal(getChatPollingDelay(1_000, 1), 2_000);
  assert.equal(getChatPollingDelay(1_000, 3), 8_000);
  assert.equal(getChatPollingDelay(3_000, 10), MAX_CHAT_POLL_MS);
});
