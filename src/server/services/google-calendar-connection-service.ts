import { googleCalendarRepository } from '@/server/repositories/google-calendar-repository';
import {
  decryptCalendarToken,
  encryptCalendarToken,
} from '@/server/security/calendar-token-crypto';

export const googleCalendarConnectionService = {
  async connect(userId: string, input: { email: string; refreshToken: string; scopes: string }) {
    await googleCalendarRepository.upsertConnection({
      userId,
      googleAccountEmail: input.email,
      encryptedRefreshToken: encryptCalendarToken(input.refreshToken, userId),
      scopes: input.scopes,
    });
  },

  async status(userId: string) {
    const connection = await googleCalendarRepository.findConnection(userId);
    return connection && !connection.revokedAt
      ? { connected: true as const, email: connection.googleAccountEmail }
      : { connected: false as const };
  },

  async disconnect(userId: string) {
    const connection = await googleCalendarRepository.findConnection(userId);
    if (!connection) return;
    try {
      const token = decryptCalendarToken(connection.encryptedRefreshToken, userId);
      await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      console.error('Google Calendar token revocation failed');
    }
    await googleCalendarRepository.deleteConnection(userId);
  },
};
