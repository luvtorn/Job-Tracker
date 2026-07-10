-- AlterTable
ALTER TABLE "vacancies" ADD COLUMN "expires_at" TIMESTAMP(3),
ADD COLUMN "archived_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "vacancies_archived_at_idx" ON "vacancies"("archived_at");

-- CreateIndex
CREATE INDEX "vacancies_expires_at_idx" ON "vacancies"("expires_at");

-- AlterTable
ALTER TABLE "applications" ADD COLUMN "interview_date" TIMESTAMP(3),
ADD COLUMN "interview_time" TEXT,
ADD COLUMN "interview_notes" TEXT;

-- CreateIndex
CREATE INDEX "applications_created_at_idx" ON "applications"("created_at" DESC);
