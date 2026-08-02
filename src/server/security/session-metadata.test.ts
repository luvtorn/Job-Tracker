import assert from 'node:assert/strict';
import test from 'node:test';
import { getSessionMetadata } from './session-metadata';

test('accepts a bounded user agent', () => {
  const request = new Request('https://example.test', {
    headers: { 'user-agent': 'Mozilla/5.0 Test Browser' },
  });
  assert.equal(getSessionMetadata(request).userAgent, 'Mozilla/5.0 Test Browser');
});

test('drops oversized and control-character user agents', () => {
  const oversized = new Request('https://example.test', {
    headers: { 'user-agent': 'a'.repeat(513) },
  });
  const unsafe = new Request('https://example.test', {
    headers: { 'user-agent': 'Browser\u0001Unsafe' },
  });
  assert.equal(getSessionMetadata(oversized).userAgent, null);
  assert.equal(getSessionMetadata(unsafe).userAgent, null);
});
