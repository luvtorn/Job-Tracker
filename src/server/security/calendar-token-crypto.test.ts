import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decryptCalendarToken,
  encryptCalendarToken,
} from '@/server/security/calendar-token-crypto';

test('encrypts Google Calendar refresh tokens with authenticated encryption', () => {
  const previousKey = process.env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY;
  process.env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');

  try {
    const first = encryptCalendarToken('refresh-token', 'user-id');
    const second = encryptCalendarToken('refresh-token', 'user-id');
    assert.notEqual(first, second);
    assert.equal(decryptCalendarToken(first, 'user-id'), 'refresh-token');
    assert.throws(() => decryptCalendarToken(first, 'other-user-id'));
  } finally {
    if (previousKey === undefined) delete process.env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY;
    else process.env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY = previousKey;
  }
});

test('rejects a modified encrypted Calendar token', () => {
  const previousKey = process.env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY;
  process.env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString('base64');

  try {
    const encrypted = encryptCalendarToken('refresh-token', 'user-id');
    const parts = encrypted.split('.');
    parts[2] = `${parts[2].startsWith('a') ? 'b' : 'a'}${parts[2].slice(1)}`;
    const modified = parts.join('.');
    assert.throws(() => decryptCalendarToken(modified, 'user-id'));
  } finally {
    if (previousKey === undefined) delete process.env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY;
    else process.env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY = previousKey;
  }
});
