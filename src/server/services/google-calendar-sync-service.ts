import { z } from 'zod';
import { env } from '@/server/config/env';
import { notFound } from '@/server/errors/application-error';
import { googleCalendarRepository } from '@/server/repositories/google-calendar-repository';
import {
  decryptCalendarToken,
  encryptCalendarToken,
  isLegacyCalendarToken,
} from '@/server/security/calendar-token-crypto';

const accessTokenSchema = z.object({ access_token: z.string().min(1) });
const googleEventSchema = z.object({
  id: z.string().min(1),
  hangoutLink: z.string().url().optional(),
  conferenceData: z.object({
    entryPoints: z.array(z.object({
      entryPointType: z.string(),
      uri: z.string().url(),
    })).optional(),
  }).optional(),
});

class CalendarSyncError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

const getAccessToken = async (encryptedRefreshToken: string, userId: string) => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      refresh_token: decryptCalendarToken(encryptedRefreshToken, userId),
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new CalendarSyncError('TOKEN_REFRESH_FAILED');
  return accessTokenSchema.parse(await response.json()).access_token;
};

const calendarRequest = (accessToken: string, path: string, init: RequestInit) =>
  fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
    signal: AbortSignal.timeout(10_000),
  });

const getMeetingUrl = (event: z.infer<typeof googleEventSchema>) =>
  event.hangoutLink
  ?? event.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === 'video')?.uri;

const upsertGoogleEvent = async (
  accessToken: string,
  event: NonNullable<
    NonNullable<Awaited<ReturnType<typeof googleCalendarRepository.findSyncJob>>>['calendarEvent']
  >,
) => {
  if (!event.googleEventId || !event.googleConferenceRequestId || !event.application) {
    throw new CalendarSyncError('INVALID_SYNC_EVENT');
  }
  const sendUpdates = event.sendCalendarInvite ? 'all' : 'none';
  const payload = {
    id: event.googleEventId,
    summary: event.title,
    description: event.description ?? undefined,
    start: { dateTime: event.startTime.toISOString() },
    end: { dateTime: event.endTime.toISOString() },
    attendees: event.sendCalendarInvite ? [{ email: event.application.user.email }] : [],
    conferenceData: {
      createRequest: {
        requestId: event.googleConferenceRequestId,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };
  const query = `conferenceDataVersion=1&sendUpdates=${sendUpdates}`;
  let response = await calendarRequest(
    accessToken,
    `/calendars/primary/events?${query}`,
    { method: 'POST', body: JSON.stringify(payload) },
  );
  if (response.status === 409) {
    const updatePayload = {
      summary: payload.summary,
      description: payload.description,
      start: payload.start,
      end: payload.end,
      attendees: payload.attendees,
    };
    response = await calendarRequest(
      accessToken,
      `/calendars/primary/events/${encodeURIComponent(event.googleEventId)}?${query}`,
      { method: 'PATCH', body: JSON.stringify(updatePayload) },
    );
  }
  if (!response.ok) throw new CalendarSyncError(`GOOGLE_EVENT_${response.status}`);
  const savedEvent = googleEventSchema.parse(await response.json());
  const meetingUrl = getMeetingUrl(savedEvent);
  if (!meetingUrl) throw new CalendarSyncError('MEET_URL_MISSING');
  return meetingUrl;
};

const deleteGoogleEvent = async (accessToken: string, googleEventId: string | null) => {
  if (!googleEventId) return;
  const response = await calendarRequest(
    accessToken,
    `/calendars/primary/events/${encodeURIComponent(googleEventId)}?sendUpdates=all`,
    { method: 'DELETE' },
  );
  if (!response.ok && response.status !== 404 && response.status !== 410) {
    throw new CalendarSyncError(`GOOGLE_DELETE_${response.status}`);
  }
};

export const googleCalendarSyncService = {
  async processJob(jobId: string) {
    if (!await googleCalendarRepository.claimSyncJob(jobId)) return;
    const job = await googleCalendarRepository.findSyncJob(jobId);
    if (!job) return;

    try {
      const connection = await googleCalendarRepository.findConnection(job.userId);
      if (!connection || connection.revokedAt) throw new CalendarSyncError('CALENDAR_NOT_CONNECTED');
      let encryptedRefreshToken = connection.encryptedRefreshToken;
      if (isLegacyCalendarToken(encryptedRefreshToken)) {
        encryptedRefreshToken = encryptCalendarToken(
          decryptCalendarToken(encryptedRefreshToken, job.userId),
          job.userId,
        );
        await googleCalendarRepository.updateEncryptedToken(
          job.userId,
          encryptedRefreshToken,
        );
      }
      const accessToken = await getAccessToken(encryptedRefreshToken, job.userId);
      const meetingUrl = job.operation === 'UPSERT'
        ? await upsertGoogleEvent(accessToken, job.calendarEvent!)
        : (await deleteGoogleEvent(accessToken, job.googleEventId), undefined);
      await googleCalendarRepository.completeSyncJob(
        job.id,
        job.calendarEventId,
        job.operation === 'UPSERT' ? 'SYNCED' : 'NOT_REQUIRED',
        meetingUrl,
      );
    } catch (error) {
      const code = error instanceof CalendarSyncError ? error.code : 'CALENDAR_SYNC_FAILED';
      await googleCalendarRepository.failSyncJob(
        job.id,
        job.calendarEventId,
        code,
        job.attempts,
      );
    }
  },

  async retryEvent(userId: string, eventId: string) {
    const job = await googleCalendarRepository.findSyncJobByEvent(eventId, userId);
    if (!job) throw notFound('Calendar sync job not found');
    await googleCalendarRepository.retryEvent(userId, eventId);
    await this.processJob(job.id);
  },
};
