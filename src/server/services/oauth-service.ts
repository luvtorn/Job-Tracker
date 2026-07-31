import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { AuthProvider } from '@prisma/client';
import { z } from 'zod';
import { env } from '@/server/config/env';
import { badRequest, unauthorized } from '@/server/errors/application-error';
import { deriveTokenKey } from '@/server/services/access-token-service';

export const oauthProviderSchema = z.enum(['google', 'github']);
export type OAuthProviderSlug = z.infer<typeof oauthProviderSchema>;
export type OAuthMode = 'login' | 'connect';

export type OAuthIdentity = {
  provider: AuthProvider;
  providerAccountId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

const googleTokenSchema = z.object({ access_token: z.string().min(1) });
const googleUserSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email(),
  email_verified: z.boolean(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  picture: z.string().url().optional(),
});
const githubTokenSchema = z.object({ access_token: z.string().min(1) });
const githubUserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
});
const githubEmailsSchema = z.array(z.object({
  email: z.string().email(),
  primary: z.boolean(),
  verified: z.boolean(),
}));
const flowSchema = z.object({
  provider: oauthProviderSchema,
  mode: z.enum(['login', 'connect']),
  state: z.string().min(32),
  verifier: z.string().min(43),
});
const registrationIntentSchema = z.object({
  provider: z.nativeEnum(AuthProvider),
  providerAccountId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
});

const redirectUri = (provider: OAuthProviderSlug) =>
  `${env.appUrl}/api/auth/oauth/${provider}/callback`;

const signClaims = (claims: object, audience: string) =>
  jwt.sign(claims, deriveTokenKey(env.jwtSecret, `oauth:${audience}`), {
    algorithm: 'HS256',
    issuer: 'jobtracker',
    audience,
    expiresIn: '10m',
  });

const verifyClaims = <T>(token: string, audience: string, schema: z.ZodType<T>) => {
  const payload = jwt.verify(token, deriveTokenKey(env.jwtSecret, `oauth:${audience}`), {
    algorithms: ['HS256'],
    issuer: 'jobtracker',
    audience,
  });
  if (typeof payload === 'string') throw unauthorized('Invalid OAuth session');
  return schema.parse(payload);
};

const postToken = async (url: string, body: URLSearchParams) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw unauthorized('OAuth authorization failed');
  return response.json();
};

const fetchJson = async (url: string, accessToken: string, headers?: HeadersInit) => {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...headers,
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw unauthorized('OAuth profile request failed');
  return response.json();
};

const splitName = (name?: string | null) => {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  return {
    firstName: parts[0] ?? null,
    lastName: parts.slice(1).join(' ') || null,
  };
};

export const oauthService = {
  createAuthorization(provider: OAuthProviderSlug, mode: OAuthMode) {
    const state = randomBytes(32).toString('base64url');
    const verifier = randomBytes(48).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    const common = {
      redirect_uri: redirectUri(provider),
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    };

    const authorizationUrl = provider === 'google'
      ? new URL('https://accounts.google.com/o/oauth2/v2/auth')
      : new URL('https://github.com/login/oauth/authorize');
    const params = provider === 'google'
      ? {
          ...common,
          client_id: env.googleClientId,
          response_type: 'code',
          scope: 'openid email profile',
        }
      : {
          ...common,
          client_id: env.githubClientId,
          scope: 'read:user user:email',
        };
    for (const [key, value] of Object.entries(params)) {
      authorizationUrl.searchParams.set(key, value);
    }

    return {
      authorizationUrl,
      flowToken: signClaims({ provider, mode, state, verifier }, 'oauth-flow'),
    };
  },

  readFlow(token: string) {
    return verifyClaims(token, 'oauth-flow', flowSchema);
  },

  createRegistrationIntent(identity: OAuthIdentity) {
    return signClaims(identity, 'oauth-registration');
  },

  readRegistrationIntent(token: string) {
    return verifyClaims(token, 'oauth-registration', registrationIntentSchema);
  },

  async exchange(provider: OAuthProviderSlug, code: string, verifier: string): Promise<OAuthIdentity> {
    if (!code) throw badRequest('Missing OAuth code');

    if (provider === 'google') {
      const token = googleTokenSchema.parse(await postToken(
        'https://oauth2.googleapis.com/token',
        new URLSearchParams({
          client_id: env.googleClientId,
          client_secret: env.googleClientSecret,
          code,
          code_verifier: verifier,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri(provider),
        }),
      ));
      const profile = googleUserSchema.parse(await fetchJson(
        'https://openidconnect.googleapis.com/v1/userinfo',
        token.access_token,
      ));
      if (!profile.email_verified) throw unauthorized('A verified email is required');
      return {
        provider: AuthProvider.GOOGLE,
        providerAccountId: profile.sub,
        email: profile.email.toLowerCase(),
        firstName: profile.given_name ?? null,
        lastName: profile.family_name ?? null,
        avatarUrl: profile.picture ?? null,
      };
    }

    const token = githubTokenSchema.parse(await postToken(
      'https://github.com/login/oauth/access_token',
      new URLSearchParams({
        client_id: env.githubClientId,
        client_secret: env.githubClientSecret,
        code,
        code_verifier: verifier,
        redirect_uri: redirectUri(provider),
      }),
    ));
    const [profile, emails] = await Promise.all([
      fetchJson('https://api.github.com/user', token.access_token, {
        'X-GitHub-Api-Version': '2026-03-10',
      }).then((value) => githubUserSchema.parse(value)),
      fetchJson('https://api.github.com/user/emails', token.access_token, {
        'X-GitHub-Api-Version': '2026-03-10',
      }).then((value) => githubEmailsSchema.parse(value)),
    ]);
    const verifiedEmail = emails.find((entry) => entry.primary && entry.verified)
      ?? emails.find((entry) => entry.verified);
    if (!verifiedEmail) throw unauthorized('A verified email is required');
    const name = splitName(profile.name);
    return {
      provider: AuthProvider.GITHUB,
      providerAccountId: String(profile.id),
      email: verifiedEmail.email.toLowerCase(),
      firstName: name.firstName,
      lastName: name.lastName,
      avatarUrl: profile.avatar_url ?? null,
    };
  },
};
