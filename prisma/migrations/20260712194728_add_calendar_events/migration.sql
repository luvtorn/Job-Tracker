-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('INTERVIEW', 'MEETING', 'DEADLINE', 'FOLLOW_UP', 'NOTE', 'OTHER');

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "eventType" "CalendarEventType" NOT NULL DEFAULT 'INTERVIEW',
    "color" TEXT NOT NULL DEFAULT 'blue',
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,
    "applicationId" UUID,
    "location" TEXT,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "calendar_events_userId_idx" ON "calendar_events"("userId");
CREATE INDEX "calendar_events_applicationId_idx" ON "calendar_events"("applicationId");
CREATE INDEX "calendar_events_start_time_idx" ON "calendar_events"("start_time" ASC);
CREATE INDEX "calendar_events_eventType_idx" ON "calendar_events"("eventType");
CREATE UNIQUE INDEX "calendar_events_applicationId_key" ON "calendar_events"("applicationId");

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
