-- CreateEnum
CREATE TYPE "VacancyStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "vacancies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "position" TEXT,
    "company" TEXT,
    "location" TEXT,
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "VacancyStatus" NOT NULL DEFAULT 'DRAFT',
    "recruiterId" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "vacancies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vacancies_recruiterId_idx" ON "vacancies"("recruiterId");

-- CreateIndex
CREATE INDEX "vacancies_status_idx" ON "vacancies"("status");

-- CreateIndex
CREATE INDEX "vacancies_created_at_idx" ON "vacancies"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
