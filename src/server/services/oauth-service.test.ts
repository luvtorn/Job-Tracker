import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthProvider } from '@prisma/client';
import { oauthService } from '@/server/services/oauth-service';

const TEST_JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-oauth-intents';

test('round-trips a short-lived OAuth registration intent', () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_JWT_SECRET;

  try {
    const identity = {
      provider: AuthProvider.GOOGLE,
      providerAccountId: 'google-user-123',
      email: 'person@example.com',
      firstName: 'Test',
      lastName: 'User',
      avatarUrl: null,
    };

    const token = oauthService.createRegistrationIntent(identity);
    assert.deepEqual(oauthService.readRegistrationIntent(token), identity);
  } finally {
    process.env.JWT_SECRET = previousSecret;
  }
});

test('rejects a modified OAuth registration intent', () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_JWT_SECRET;

  try {
    const token = oauthService.createRegistrationIntent({
      provider: AuthProvider.GITHUB,
      providerAccountId: 'github-user-123',
      email: 'person@example.com',
      firstName: null,
      lastName: null,
      avatarUrl: null,
    });
    const modifiedToken = `${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`;

    assert.throws(() => oauthService.readRegistrationIntent(modifiedToken));
  } finally {
    process.env.JWT_SECRET = previousSecret;
  }
});
