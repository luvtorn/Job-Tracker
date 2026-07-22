import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const canUseTestDatabase = Boolean(testDatabaseUrl && /test/i.test(testDatabaseUrl));

test('application and vacancy services enforce ownership against the test database', {
  skip: canUseTestDatabase ? false : 'Set a dedicated TEST_DATABASE_URL containing “test” to run database integration tests',
}, async () => {
  process.env.DATABASE_URL = testDatabaseUrl;
  const [{ prisma }, { applicationService }, { vacancyService }] = await Promise.all([
    import('@/lib/prisma'),
    import('@/server/services/application-service'),
    import('@/server/services/vacancy-service'),
  ]);

  const suffix = randomUUID();
  const recruiter = await prisma.user.create({
    data: { email: `recruiter-${suffix}@example.test`, passwordHash: 'integration-test', role: 'RECRUITER' },
  });
  const otherRecruiter = await prisma.user.create({
    data: { email: `other-${suffix}@example.test`, passwordHash: 'integration-test', role: 'RECRUITER' },
  });
  const seeker = await prisma.user.create({
    data: { email: `seeker-${suffix}@example.test`, passwordHash: 'integration-test', role: 'SEEKER' },
  });

  try {
    const vacancy = await vacancyService.createVacancy(recruiter.id, {
      title: 'Integration test vacancy',
      description: 'A dedicated integration test vacancy description.',
      company: 'Example',
      location: 'Remote',
      currency: 'USD',
    });
    const { application } = await applicationService.create(seeker, vacancy.id);
    assert.equal(application.userId, seeker.id);

    await assert.rejects(
      vacancyService.updateVacancy(otherRecruiter.id, vacancy.id, {
        title: 'Unauthorized update',
        description: 'This update must never reach the repository write.',
        currency: 'USD',
      }),
      (error: unknown) => error instanceof Error && error.message === 'Vacancy not found',
    );
    await assert.rejects(
      applicationService.getCandidateProfile(otherRecruiter.id, application.id),
      (error: unknown) => error instanceof Error && error.message === 'Candidate profile not found',
    );
  } finally {
    await prisma.user.deleteMany({ where: { id: { in: [recruiter.id, otherRecruiter.id, seeker.id] } } });
    await prisma.$disconnect();
  }
});
