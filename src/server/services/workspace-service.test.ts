import assert from 'node:assert/strict';
import test from 'node:test';
import { getReminderGroup } from './reminder-grouping';

const now = new Date(2026, 6, 20, 12);
test('groups incomplete reminders by local calendar day', () => {
  assert.equal(getReminderGroup(new Date(2026, 6, 19, 23), null, now), 'overdue');
  assert.equal(getReminderGroup(new Date(2026, 6, 20, 1), null, now), 'today');
  assert.equal(getReminderGroup(new Date(2026, 6, 21), null, now), 'upcoming');
});
test('completed reminders stay completed', () => assert.equal(getReminderGroup(new Date(2026, 6, 19), new Date(), now), 'completed'));
