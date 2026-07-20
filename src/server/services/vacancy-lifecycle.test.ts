import assert from "node:assert/strict";
import test from "node:test";
import { assertVacancyStatusTransition, getVacancyLifecycleUpdate } from "./vacancy-lifecycle";

const now = new Date("2026-07-19T12:00:00.000Z");

test("archives a vacancy", () => {
  assert.deepEqual(getVacancyLifecycleUpdate("ARCHIVED", now), { status: "ARCHIVED", archivedAt: now });
});

test("reactivates without changing createdAt", () => {
  assert.deepEqual(getVacancyLifecycleUpdate("PUBLISHED", now), {
    status: "PUBLISHED", archivedAt: null, closedAt: null, publishedAt: now,
  });
});

test("closes a vacancy", () => {
  assert.deepEqual(getVacancyLifecycleUpdate("CLOSED", now), { status: "CLOSED", closedAt: now });
});

test("allows only valid lifecycle transitions", () => {
  assert.doesNotThrow(() => assertVacancyStatusTransition("PUBLISHED", "CLOSED"));
  assert.doesNotThrow(() => assertVacancyStatusTransition("CLOSED", "ARCHIVED"));
  assert.doesNotThrow(() => assertVacancyStatusTransition("ARCHIVED", "PUBLISHED"));
  assert.throws(() => assertVacancyStatusTransition("ARCHIVED", "CLOSED"));
  assert.throws(() => assertVacancyStatusTransition("PUBLISHED", "PUBLISHED"));
});
