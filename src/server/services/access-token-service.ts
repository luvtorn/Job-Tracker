import { hkdfSync } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '@/server/config/env';

const ISSUER = 'jobtracker';
const AUDIENCE = 'jobtracker-api';

export type AccessTokenPayload = {
  userId: string;
  role: 'SEEKER' | 'RECRUITER' | 'ADMIN';
  authVersion: number;
};

export const deriveTokenKey = (masterSecret: string, purpose: string) =>
  Buffer.from(hkdfSync(
    'sha256',
    Buffer.from(masterSecret, 'utf8'),
    Buffer.from('jobtracker-token-keys', 'utf8'),
    Buffer.from(purpose, 'utf8'),
    32,
  ));

export const signAccessToken = (
  payload: AccessTokenPayload,
  secret = env.jwtSecret,
) => jwt.sign(
  { role: payload.role, authVersion: payload.authVersion },
  deriveTokenKey(secret, 'access-token'),
  {
    algorithm: 'HS256',
    issuer: ISSUER,
    audience: AUDIENCE,
    subject: payload.userId,
    expiresIn: '15m',
  },
);

export function verifyAccessToken(
  token: string,
  secret = env.jwtSecret,
): AccessTokenPayload {
  const payload = jwt.verify(token, deriveTokenKey(secret, 'access-token'), {
    algorithms: ['HS256'],
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  if (
    typeof payload === 'string'
    || typeof payload.sub !== 'string'
    || typeof payload.authVersion !== 'number'
    || !['SEEKER', 'RECRUITER', 'ADMIN'].includes(String(payload.role))
  ) {
    throw new Error('Invalid access token payload');
  }
  return {
    userId: payload.sub,
    role: payload.role as AccessTokenPayload['role'],
    authVersion: payload.authVersion,
  };
}
