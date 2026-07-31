export const GOOGLE_CALENDAR_CONNECTION_ERROR_CODES = [
  'access_denied',
  'invalid_client',
  'invalid_grant',
  'redirect_uri_mismatch',
  'provider_error',
  'provider_unavailable',
  'invalid_token_response',
  'missing_refresh_token',
  'userinfo_failed',
  'invalid_user_response',
  'email_not_verified',
  'calendar_scope_missing',
  'session_expired',
  'state_mismatch',
  'invalid_callback',
  'connection_save_failed',
  'connection_failed',
] as const;

export type GoogleCalendarConnectionErrorCode =
  (typeof GOOGLE_CALENDAR_CONNECTION_ERROR_CODES)[number];

export const isGoogleCalendarConnectionErrorCode = (
  value: string,
): value is GoogleCalendarConnectionErrorCode =>
  GOOGLE_CALENDAR_CONNECTION_ERROR_CODES.some((code) => code === value);
