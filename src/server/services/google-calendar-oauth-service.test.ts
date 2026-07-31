import assert from 'node:assert/strict';
import { after, afterEach, test } from 'node:test';
import {
  getGoogleCalendarConnectionErrorCode,
  googleCalendarOAuthService,
} from '@/server/services/google-calendar-oauth-service';

const originalFetch = globalThis.fetch;
const originalAppUrl = process.env.APP_URL;
const originalGoogleClientId = process.env.GOOGLE_CLIENT_ID;
const originalGoogleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

process.env.APP_URL = 'http://localhost:3000';
process.env.GOOGLE_CLIENT_ID = 'google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';

afterEach(() => {
  globalThis.fetch = originalFetch;
});

after(() => {
  if (originalAppUrl === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = originalAppUrl;
  if (originalGoogleClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
  else process.env.GOOGLE_CLIENT_ID = originalGoogleClientId;
  if (originalGoogleClientSecret === undefined) delete process.env.GOOGLE_CLIENT_SECRET;
  else process.env.GOOGLE_CLIENT_SECRET = originalGoogleClientSecret;
});

test('reports a safe provider error code without exposing the provider response', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({
    error: 'invalid_client',
    error_description: 'sensitive provider detail',
  }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  await assert.rejects(
    googleCalendarOAuthService.exchange('authorization-code', 'v'.repeat(43)),
    (error: unknown) => {
      assert.equal(getGoogleCalendarConnectionErrorCode(error), 'invalid_client');
      assert.doesNotMatch(String(error), /sensitive provider detail/);
      return true;
    },
  );
});

test('reports when Google omits the offline refresh token', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({
    access_token: 'access-token',
    scope: 'openid email https://www.googleapis.com/auth/calendar.events',
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  await assert.rejects(
    googleCalendarOAuthService.exchange('authorization-code', 'v'.repeat(43)),
    (error: unknown) => getGoogleCalendarConnectionErrorCode(error) === 'missing_refresh_token',
  );
});

test('reports when Google does not grant the Calendar scope', async () => {
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;
    if (requestCount === 1) {
      return new Response(JSON.stringify({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        scope: 'openid email',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({
      email: 'recruiter@example.com',
      email_verified: true,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  await assert.rejects(
    googleCalendarOAuthService.exchange('authorization-code', 'v'.repeat(43)),
    (error: unknown) => getGoogleCalendarConnectionErrorCode(error) === 'calendar_scope_missing',
  );
});
