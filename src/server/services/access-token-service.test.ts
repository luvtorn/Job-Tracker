import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import {
  deriveTokenKey,
  signAccessToken,
  verifyAccessToken,
} from './access-token-service';

const secret = 'correct-secret-with-at-least-thirty-two-bytes';
const payload = {
  userId: 'user-id',
  role: 'SEEKER' as const,
  authVersion: 3,
};

test('verifies a correctly signed access token', () => {
  const token = signAccessToken(payload, secret);
  assert.deepEqual(verifyAccessToken(token, secret), payload);
});

test('rejects a token signed with another secret', () => {
  const token = signAccessToken(payload, 'another-secret-with-at-least-thirty-two-bytes');
  assert.throws(() => verifyAccessToken(token, secret));
});

test('rejects expired and incorrectly scoped tokens', () => {
  const token = jwt.sign(
    { role: payload.role, authVersion: payload.authVersion },
    deriveTokenKey(secret, 'access-token'),
    {
      algorithm: 'HS256',
      subject: payload.userId,
      issuer: 'jobtracker',
      audience: 'jobtracker-api',
      expiresIn: -1,
    },
  );
  assert.throws(() => verifyAccessToken(token, secret));

  const wrongAudience = jwt.sign(
    { role: payload.role, authVersion: payload.authVersion },
    deriveTokenKey(secret, 'access-token'),
    {
      algorithm: 'HS256',
      subject: payload.userId,
      issuer: 'jobtracker',
      audience: 'other-service',
      expiresIn: '1m',
    },
  );
  assert.throws(() => verifyAccessToken(wrongAudience, secret));
});
