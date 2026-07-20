-- Reconcile schema changes that existed in the development database but were
-- missing from the earlier migration history, then add seeker workspace tables.
CREATE TYPE "DocumentType" AS ENUM ('RESUME', 'COVER_LETTER');

ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_user_id_fkey";
DROP INDEX IF EXISTS "notifications_user_id_idx";
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "application_id", DROP COLUMN IF EXISTS "user_id", DROP COLUMN IF EXISTS "vacancy_id";
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "applicationId" UUID, ADD COLUMN IF NOT EXISTS "userId" UUID, ADD COLUMN IF NOT EXISTS "vacancyId" UUID;
ALTER TABLE "notifications" ALTER COLUMN "userId" SET NOT NULL;

CREATE TABLE "documents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "type" "DocumentType" NOT NULL,
  "original_filename" VARCHAR(255) NOT NULL, "public_id" TEXT NOT NULL,
  "is_current" BOOLEAN NOT NULL DEFAULT true, "userId" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "application_documents" (
  "applicationId" UUID NOT NULL, "documentId" UUID NOT NULL, "type" "DocumentType" NOT NULL,
  CONSTRAINT "application_documents_pkey" PRIMARY KEY ("applicationId", "type")
);
CREATE TABLE "companies" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "name" VARCHAR(255) NOT NULL, "website" TEXT,
  "location" TEXT, "notes" TEXT, "userId" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "contacts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "first_name" TEXT NOT NULL, "last_name" TEXT NOT NULL,
  "email" TEXT, "phone" TEXT, "role" TEXT, "notes" TEXT, "userId" UUID NOT NULL, "companyId" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "application_notes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "content" TEXT NOT NULL, "userId" UUID NOT NULL,
  "applicationId" UUID NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "application_notes_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "tags" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "name" VARCHAR(50) NOT NULL,
  "color" VARCHAR(32) NOT NULL DEFAULT 'blue', "userId" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "application_tags" (
  "applicationId" UUID NOT NULL, "tagId" UUID NOT NULL,
  CONSTRAINT "application_tags_pkey" PRIMARY KEY ("applicationId", "tagId")
);
CREATE TABLE "reminders" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "title" VARCHAR(255) NOT NULL, "due_at" TIMESTAMP(3) NOT NULL,
  "completed_at" TIMESTAMP(3), "userId" UUID NOT NULL, "applicationId" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "wishlist" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "userId" UUID NOT NULL, "vacancyId" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "wishlist_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "documents_userId_type_is_current_idx" ON "documents"("userId", "type", "is_current");
CREATE INDEX "application_documents_documentId_idx" ON "application_documents"("documentId");
CREATE INDEX "companies_userId_idx" ON "companies"("userId");
CREATE UNIQUE INDEX "companies_userId_name_key" ON "companies"("userId", "name");
CREATE INDEX "contacts_userId_idx" ON "contacts"("userId"); CREATE INDEX "contacts_companyId_idx" ON "contacts"("companyId");
CREATE INDEX "application_notes_userId_idx" ON "application_notes"("userId"); CREATE INDEX "application_notes_applicationId_idx" ON "application_notes"("applicationId");
CREATE INDEX "tags_userId_idx" ON "tags"("userId"); CREATE UNIQUE INDEX "tags_userId_name_key" ON "tags"("userId", "name");
CREATE INDEX "application_tags_tagId_idx" ON "application_tags"("tagId");
CREATE INDEX "reminders_userId_due_at_idx" ON "reminders"("userId", "due_at"); CREATE INDEX "reminders_applicationId_idx" ON "reminders"("applicationId");
CREATE INDEX "wishlist_userId_idx" ON "wishlist"("userId"); CREATE INDEX "wishlist_vacancyId_idx" ON "wishlist"("vacancyId"); CREATE UNIQUE INDEX "wishlist_userId_vacancyId_key" ON "wishlist"("userId", "vacancyId");
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId"); CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

ALTER TABLE "documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "companies" ADD CONSTRAINT "companies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tags" ADD CONSTRAINT "tags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "application_tags" ADD CONSTRAINT "application_tags_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "application_tags" ADD CONSTRAINT "application_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_vacancyId_fkey" FOREIGN KEY ("vacancyId") REFERENCES "vacancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
