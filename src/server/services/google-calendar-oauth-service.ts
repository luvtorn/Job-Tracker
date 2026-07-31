import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '@/server/config/env';
import { deriveTokenKey } from '@/server/services/access-token-service';
import type { GoogleCalendarConnectionErrorCode } from '@/types/google-calendar';

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

const flowSchema = z.object({
  userId: z.string().uuid(),
  state: z.string().min(32),
  verifier: z.string().min(43),
});
const tokenSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1).optional(),
  scope: z.string().default(''),
});
const userSchema = z.object({
  email: z.string().email(),
  email_verified: z.boolean(),
});
const providerErrorCodeSchema = z.enum([
  'access_denied',
  'invalid_client',
  'invalid_grant',
  'redirect_uri_mismatch',
]);
const providerErrorSchema = z.object({ error: providerErrorCodeSchema });

export class GoogleCalendarConnectionError extends Error {
  constructor(readonly code: GoogleCalendarConnectionErrorCode) {
    super(code);
    this.name = 'GoogleCalendarConnectionError';
  }
}

export const createGoogleCalendarConnectionError = (
  code: GoogleCalendarConnectionErrorCode,
) => new GoogleCalendarConnectionError(code);

export const getGoogleCalendarConnectionErrorCode = (
  error: unknown,
): GoogleCalendarConnectionErrorCode =>
  error instanceof GoogleCalendarConnectionError ? error.code : 'connection_failed';

const callbackUrl = () => `${env.appUrl}/api/integrations/google-calendar/callback`;

const providerErrorCode = async (
  response: Response,
  fallback: GoogleCalendarConnectionErrorCode,
) => {
  try {
    const body: unknown = await response.json();
    const parsed = providerErrorSchema.safeParse(body);
    if (parsed.success) return parsed.data.error;
  } catch {
    return fallback;
  }
  return fallback;
};

const fetchJson = async (
  url: string,
  init: RequestInit,
  failureCode: GoogleCalendarConnectionErrorCode,
) => {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw createGoogleCalendarConnectionError('provider_unavailable');
  }
  if (!response.ok) {
    throw createGoogleCalendarConnectionError(
      await providerErrorCode(response, failureCode),
    );
  }
  try {
    const body: unknown = await response.json();
    return body;
  } catch {
    throw createGoogleCalendarConnectionError(failureCode);
  }
};

export const googleCalendarOAuthService = {
  createAuthorization(userId: string) {
    const state = randomBytes(32).toString('base64url');
    const verifier = randomBytes(48).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    const params = {
      client_id: env.googleClientId,
      redirect_uri: callbackUrl(),
      response_type: 'code',
      scope: `openid email ${CALENDAR_SCOPE}`,
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    };
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    return {
      url,
      flowToken: jwt.sign(
        { userId, state, verifier },
        deriveTokenKey(env.jwtSecret, 'oauth:google-calendar'),
        {
        algorithm: 'HS256',
        issuer: 'jobtracker',
        audience: 'google-calendar-oauth',
        expiresIn: '10m',
        },
      ),
    };
  },

  readFlow(token: string) {
    try {
      const claims = jwt.verify(
        token,
        deriveTokenKey(env.jwtSecret, 'oauth:google-calendar'),
        {
          algorithms: ['HS256'],
          issuer: 'jobtracker',
          audience: 'google-calendar-oauth',
        },
      );
      if (typeof claims === 'string') {
        throw createGoogleCalendarConnectionError('session_expired');
      }
      const flow = flowSchema.safeParse(claims);
      if (!flow.success) throw createGoogleCalendarConnectionError('session_expired');
      return flow.data;
    } catch (error) {
      if (error instanceof GoogleCalendarConnectionError) throw error;
      throw createGoogleCalendarConnectionError('session_expired');
    }
  },

  async exchange(code: string, verifier: string) {
    const tokenResult = tokenSchema.safeParse(await fetchJson('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.googleClientId,
        client_secret: env.googleClientSecret,
        code,
        code_verifier: verifier,
        grant_type: 'authorization_code',
        redirect_uri: callbackUrl(),
      }),
    }, 'invalid_token_response'));
    if (!tokenResult.success) {
      throw createGoogleCalendarConnectionError('invalid_token_response');
    }
    const token = tokenResult.data;
    if (!token.refresh_token) {
      throw createGoogleCalendarConnectionError('missing_refresh_token');
    }
    const userResult = userSchema.safeParse(await fetchJson(
      'https://openidconnect.googleapis.com/v1/userinfo',
      { headers: { Authorization: `Bearer ${token.access_token}` } },
      'userinfo_failed',
    ));
    if (!userResult.success) {
      throw createGoogleCalendarConnectionError('invalid_user_response');
    }
    const user = userResult.data;
    if (!user.email_verified) {
      throw createGoogleCalendarConnectionError('email_not_verified');
    }
    const grantedScopes = new Set(token.scope.split(/\s+/).filter(Boolean));
    if (!grantedScopes.has(CALENDAR_SCOPE)) {
      throw createGoogleCalendarConnectionError('calendar_scope_missing');
    }
    return {
      email: user.email.toLowerCase(),
      refreshToken: token.refresh_token,
      scopes: token.scope,
    };
  },
};
