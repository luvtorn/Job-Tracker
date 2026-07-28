import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '@/server/config/env';
import { unauthorized } from '@/server/errors/application-error';

const flowSchema = z.object({
  userId: z.string().uuid(),
  state: z.string().min(32),
  verifier: z.string().min(43),
});
const tokenSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  scope: z.string().default(''),
});
const userSchema = z.object({
  email: z.string().email(),
  email_verified: z.boolean(),
});

const callbackUrl = () => `${env.appUrl}/api/integrations/google-calendar/callback`;

const fetchJson = async (url: string, init: RequestInit) => {
  const response = await fetch(url, init);
  if (!response.ok) throw unauthorized('Google Calendar authorization failed');
  return response.json();
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
      scope: 'openid email https://www.googleapis.com/auth/calendar.events',
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
      flowToken: jwt.sign({ userId, state, verifier }, env.jwtSecret, {
        issuer: 'jobtracker',
        audience: 'google-calendar-oauth',
        expiresIn: '10m',
      }),
    };
  },

  readFlow(token: string) {
    const claims = jwt.verify(token, env.jwtSecret, {
      issuer: 'jobtracker',
      audience: 'google-calendar-oauth',
    });
    if (typeof claims === 'string') throw unauthorized('Invalid Google Calendar session');
    return flowSchema.parse(claims);
  },

  async exchange(code: string, verifier: string) {
    const token = tokenSchema.parse(await fetchJson('https://oauth2.googleapis.com/token', {
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
    }));
    const user = userSchema.parse(await fetchJson(
      'https://openidconnect.googleapis.com/v1/userinfo',
      { headers: { Authorization: `Bearer ${token.access_token}` } },
    ));
    if (!user.email_verified) throw unauthorized('A verified Google email is required');
    return {
      email: user.email.toLowerCase(),
      refreshToken: token.refresh_token,
      scopes: token.scope,
    };
  },
};
