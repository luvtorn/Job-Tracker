# Production configuration

JobTracker requires separate OAuth consent for sign-in and Google Calendar. Configure exact HTTPS callback URLs in each provider:

- Google sign-in: `https://YOUR_DOMAIN/api/auth/oauth/google/callback`
- GitHub sign-in: `https://YOUR_DOMAIN/api/auth/oauth/github/callback`
- Google Calendar: `https://YOUR_DOMAIN/api/integrations/google-calendar/callback`

Required runtime variables:

- `APP_URL`
- `DATABASE_URL`
- `JWT_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY`
- Cloudinary variables already used by the document and avatar flows

`GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY` must be a base64-encoded random 32-byte value. Keep it in the production secret store, never rotate it without re-encrypting or removing existing Calendar connections, and never expose it to the browser.

The Google application needs profile/email scopes for sign-in and `calendar.events` for the separate Calendar consent. Calendar access uses offline refresh tokens. JobTracker encrypts those tokens at rest and never returns them through an API.

Configure a verified Resend sender domain before enabling email registration. Verification links expire after 24 hours and password-reset links after 30 minutes.

Before release:

1. Apply migrations to a staging Neon branch and run `prisma migrate status`.
2. Verify the Neon restore/backup procedure.
3. Run the CI quality gate and browser smoke.
4. Test all exact OAuth callbacks in Chrome and Edge.
5. Verify revoked Google access, failed Calendar sync, manual Meet fallback, and account deletion cascades.

Operational logs may contain only event names and safe error categories. Never log email addresses, provider codes, access/refresh tokens, Meet URLs, interview notes, or document contents.
