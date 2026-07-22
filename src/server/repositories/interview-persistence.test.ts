import assert from "node:assert/strict";
import test from "node:test";
import { buildInterviewCleanup, buildInterviewPersistence } from "./interview-persistence";
import { cancelInterviewSchema } from "@/server/validators/application-validator";
import { scheduleInterviewSchema } from "@/server/validators/vacancy-validator";

test("persists one interview event keyed by application", () => {
  const input = {
    applicationId: "application-id",
    interviewDate: new Date(2026, 6, 25),
    interviewTime: "14:30",
    interviewNotes: "Bring portfolio",
    eventStart: new Date(2026, 6, 25, 14, 30),
    eventEnd: new Date(2026, 6, 25, 15, 30),
    eventTitle: "Interview: Candidate - Engineer",
    recruiterId: "recruiter-id",
    setInterviewing: true,
  };

  const persistence = buildInterviewPersistence(input);

  assert.deepEqual(persistence.calendarEvent.where, { applicationId: "application-id" });
  assert.equal(persistence.calendarEvent.create.applicationId, "application-id");
  assert.equal(persistence.calendarEvent.update.startTime, input.eventStart);
  assert.equal(persistence.calendarEvent.update.title, input.eventTitle);
});

test("interview cleanup clears schedule and targets only its linked event", () => {
  const persistence = buildInterviewCleanup("application-id", "INTERVIEWING");

  assert.deepEqual(persistence.application.data, {
    status: "INTERVIEWING",
    interviewDate: null,
    interviewTime: null,
    interviewNotes: null,
  });
  assert.deepEqual(persistence.calendarEvent, { where: { applicationId: "application-id" } });
});

test("interview cancellation accepts only the two supported status outcomes", () => {
  assert.equal(cancelInterviewSchema.safeParse({ nextStatus: "APPLIED" }).success, true);
  assert.equal(cancelInterviewSchema.safeParse({ nextStatus: "INTERVIEWING" }).success, true);
  assert.equal(cancelInterviewSchema.safeParse({ nextStatus: "REJECTED" }).success, false);
  assert.equal(cancelInterviewSchema.safeParse({ nextStatus: "APPLIED", extra: true }).success, false);
});

test("interview scheduling requires an exact future instant", () => {
  const future = new Date(Date.now() + 60_000).toISOString();
  const valid = { interviewDate: "2026-07-25", interviewTime: "14:30", scheduledAt: future };

  assert.equal(scheduleInterviewSchema.safeParse(valid).success, true);
  assert.equal(scheduleInterviewSchema.safeParse({ ...valid, scheduledAt: new Date(0).toISOString() }).success, false);
  assert.equal(scheduleInterviewSchema.safeParse({ ...valid, scheduledAt: "2026-07-25 14:30" }).success, false);
});
