import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { resolve } from 'node:path';

const files = [
  'src/app/page.tsx',
  'src/app/(protected)/dashboard/page.tsx',
  'src/features/applications/components/applications-list.tsx',
  'src/features/candidates/components/candidates-list.tsx',
  'src/app/jobs/page.tsx',
  'src/app/jobs/[id]/page.tsx',
  'src/features/calendar/components/calendar-interviews.tsx',
  'src/features/calendar/components/create-event-modal.tsx',
  'src/features/calendar/components/interview-side-panel.tsx',
  'src/features/candidates/components/schedule-interview-modal.tsx',
];

const forbiddenInterfaceText = [
  'Welcome to JobTracker',
  'Find Your Next',
  'Latest Opportunities',
  '>Dashboard<',
  '>Welcome back!',
  '>No applications yet<',
  '>View profile<',
  'Browse Job Opportunities',
  'Search and apply to positions',
  '>Schedule Interview<',
  '>Interview Details<',
  '>Create Event<',
  '>Remove Interview?<',
];

test('core localized interfaces do not reintroduce hardcoded English copy', () => {
  const source = files.map((file) => readFileSync(resolve(file), 'utf8')).join('\n');

  for (const text of forbiddenInterfaceText) {
    assert.equal(source.includes(text), false, `Found hardcoded interface text: ${text}`);
  }
});
