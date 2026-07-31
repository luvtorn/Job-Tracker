CREATE TYPE "InterviewMeetingType" AS ENUM ('NONE', 'MANUAL_GOOGLE_MEET', 'GOOGLE_MEET');
CREATE TYPE "CalendarSyncState" AS ENUM ('NOT_REQUIRED', 'PENDING', 'SYNCED', 'FAILED');
CREATE TYPE "CalendarSyncOperation" AS ENUM ('UPSERT', 'DELETE');
CREATE TYPE "CalendarSyncJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED');

ALTER TABLE "calendar_events"
ADD COLUMN "meeting_type" "InterviewMeetingType" NOT NULL DEFAULT 'NONE',
ADD COLUMN "meeting_url" VARCHAR(500),
ADD COLUMN "send_calendar_invite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "google_event_id" VARCHAR(255),
ADD COLUMN "google_conference_request_id" VARCHAR(64),
ADD COLUMN "sync_state" "CalendarSyncState" NOT NULL DEFAULT 'NOT_REQUIRED',
ADD COLUMN "sync_error_code" VARCHAR(100);

CREATE UNIQUE INDEX "calendar_events_google_event_id_key"
ON "calendar_events"("google_event_id");

CREATE TABLE "google_calendar_connections" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "google_account_email" VARCHAR(320) NOT NULL,
  "encrypted_refresh_token" TEXT NOT NULL,
  "scopes" TEXT NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "google_calendar_connections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "google_calendar_connections_user_id_key"
ON "google_calendar_connections"("user_id");

CREATE TABLE "calendar_sync_jobs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "calendar_event_id" UUID,
  "operation" "CalendarSyncOperation" NOT NULL,
  "status" "CalendarSyncJobStatus" NOT NULL DEFAULT 'PENDING',
  "google_event_id" VARCHAR(255),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_error_code" VARCHAR(100),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "calendar_sync_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "calendar_sync_jobs_calendar_event_id_key"
ON "calendar_sync_jobs"("calendar_event_id");
CREATE INDEX "calendar_sync_jobs_user_id_idx"
ON "calendar_sync_jobs"("user_id");
CREATE INDEX "calendar_sync_jobs_status_next_attempt_at_idx"
ON "calendar_sync_jobs"("status", "next_attempt_at");

ALTER TABLE "google_calendar_connections"
ADD CONSTRAINT "google_calendar_connections_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "calendar_sync_jobs"
ADD CONSTRAINT "calendar_sync_jobs_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "calendar_sync_jobs"
ADD CONSTRAINT "calendar_sync_jobs_calendar_event_id_fkey"
FOREIGN KEY ("calendar_event_id") REFERENCES "calendar_events"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
