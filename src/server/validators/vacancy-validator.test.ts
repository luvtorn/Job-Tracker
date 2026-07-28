import assert from 'node:assert/strict';
import test from 'node:test';
import { createVacancySchema } from './vacancy-validator';

const validVacancy = {
  title: 'Senior developer',
  company: 'Example company',
  location: 'Warsaw',
  position: 'Full-time',
  description: 'A detailed vacancy description with responsibilities, team context, goals, and expected outcomes. '.repeat(2),
  requirements: 'Several years of relevant experience and strong communication skills.',
  currency: 'USD' as const,
};

test('accepts a complete vacancy without salary', () => {
  assert.equal(createVacancySchema.safeParse(validVacancy).success, true);
});

test('requires both salary boundaries', () => {
  const result = createVacancySchema.safeParse({ ...validVacancy, salaryMin: 50000 });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.issues.some((issue) => issue.message === 'vacancy.salary.pair'), true);
  }
});

test('rejects an inverted salary range', () => {
  const result = createVacancySchema.safeParse({ ...validVacancy, salaryMin: 90000, salaryMax: 50000 });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.issues.some((issue) => issue.message === 'vacancy.salary.range'), true);
  }
});

test('rejects descriptions and requirements below publication minimums', () => {
  const result = createVacancySchema.safeParse({ ...validVacancy, description: 'Too short', requirements: 'Too short' });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.deepEqual(
      result.error.issues.map((issue) => issue.message),
      ['vacancy.description.min', 'vacancy.requirements.min'],
    );
  }
});
