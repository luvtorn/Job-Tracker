import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const canUseTestDatabase = Boolean(testDatabaseUrl && /test/i.test(testDatabaseUrl));

test('refresh replay revokes the complete session family', {
  skip: canUseTestDatabase
    ? false
    : 'Set a dedicated TEST_DATABASE_URL containing "test" to run database integration tests',
}, async () => {
  process.env.DATABASE_URL = testDatabaseUrl;
  const [{ prisma }, { rotateRefreshToken }] = await Promise.all([
    import('@/lib/prisma'),
    import('@/server/repositories/user-repository'),
  ]);

  const suffix = randomUUID();
  const familyId = randomUUID();
  const firstHash = `first-${suffix}`;
  const secondHash = `second-${suffix}`;
  const user = await prisma.user.create({
    data: {
      email: `session-${suffix}@example.test`,
      passwordHash: 'integration-test',
      emailVerified: true,
    },
  });
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: firstHash,
      familyId,
      expiresAt: new Date(Date.now() + 60_000),
    },
  });

  try {
    const rotated = await rotateRefreshToken(firstHash, secondHash);
    assert.equal(rotated?.user.id, user.id);

    const replay = await rotateRefreshToken(firstHash, `third-${suffix}`);
    assert.equal(replay, null);

    const family = await prisma.refreshToken.findMany({ where: { familyId } });
    assert.equal(family.length, 2);
    assert.equal(family.every((token) => token.revokedAt instanceof Date), true);
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
});
