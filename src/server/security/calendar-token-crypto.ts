import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '@/server/config/env';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';

const getKey = () => {
  const key = Buffer.from(env.googleCalendarTokenEncryptionKey, 'base64');
  if (key.length !== 32) {
    throw new Error('GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
  }
  return key;
};

const getAdditionalData = (userId: string) =>
  Buffer.from(`jobtracker:google-calendar:${userId}`, 'utf8');

export const isLegacyCalendarToken = (encryptedToken: string) =>
  !encryptedToken.startsWith(`${VERSION}.`);

export const encryptCalendarToken = (token: string, userId: string) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  cipher.setAAD(getAdditionalData(userId));
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    ...[iv, tag, encrypted].map((part) => part.toString('base64url')),
  ].join('.');
};

export const decryptCalendarToken = (encryptedToken: string, userId: string) => {
  const parts = encryptedToken.split('.');
  const legacy = parts.length === 3;
  const encodedParts = legacy ? parts : parts.slice(1);
  if ((!legacy && parts[0] !== VERSION) || encodedParts.length !== 3) {
    throw new Error('Invalid encrypted calendar token');
  }
  const [iv, tag, encrypted] = encodedParts.map((part) => Buffer.from(part, 'base64url'));
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  if (!legacy) decipher.setAAD(getAdditionalData(userId));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
};
