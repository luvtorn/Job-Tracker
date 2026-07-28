import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '@/server/config/env';

const ALGORITHM = 'aes-256-gcm';

const getKey = () => {
  const key = Buffer.from(env.googleCalendarTokenEncryptionKey, 'base64');
  if (key.length !== 32) {
    throw new Error('GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
  }
  return key;
};

export const encryptCalendarToken = (token: string) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString('base64url')).join('.');
};

export const decryptCalendarToken = (encryptedToken: string) => {
  const parts = encryptedToken.split('.');
  if (parts.length !== 3) throw new Error('Invalid encrypted calendar token');
  const [iv, tag, encrypted] = parts.map((part) => Buffer.from(part, 'base64url'));
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
};
