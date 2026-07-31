-- CreateEnum
CREATE TYPE "DocumentScanStatus" AS ENUM (
  'PENDING_UPLOAD',
  'SCANNING',
  'CLEAN',
  'REJECTED',
  'FAILED'
);

-- Force one-time reauthentication before enabling replay-resistant sessions.
DELETE FROM "refresh_tokens";

ALTER TABLE "users"
ADD COLUMN "auth_version" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "refresh_tokens"
ADD COLUMN "family_id" UUID,
ADD COLUMN "used_at" TIMESTAMP(3),
ADD COLUMN "revoked_at" TIMESTAMP(3);

UPDATE "refresh_tokens" SET "family_id" = gen_random_uuid() WHERE "family_id" IS NULL;
ALTER TABLE "refresh_tokens" ALTER COLUMN "family_id" SET NOT NULL;

ALTER TABLE "documents"
ADD COLUMN "scan_status" "DocumentScanStatus" NOT NULL DEFAULT 'CLEAN',
ADD COLUMN "upload_expires_at" TIMESTAMP(3);

ALTER TABLE "calendar_sync_jobs"
ADD COLUMN "locked_at" TIMESTAMP(3);

CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id");
CREATE UNIQUE INDEX "documents_public_id_key" ON "documents"("public_id");
CREATE INDEX "documents_scan_status_upload_expires_at_idx"
ON "documents"("scan_status", "upload_expires_at");
