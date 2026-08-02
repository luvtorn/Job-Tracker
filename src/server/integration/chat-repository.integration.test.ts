import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const canUseTestDatabase = Boolean(testDatabaseUrl && /test/i.test(testDatabaseUrl));

test('application chat enforces participants, idempotency, unread state, and terminal status', {
  skip: canUseTestDatabase ? false : 'Set a dedicated TEST_DATABASE_URL containing "test" to run database integration tests',
}, async () => {
  process.env.DATABASE_URL = testDatabaseUrl;
  const [{ prisma }, { chatRepository }, { chatService }] = await Promise.all([
    import('@/lib/prisma'),
    import('@/server/repositories/chat-repository'),
    import('@/server/services/chat-service'),
  ]);
  const suffix = randomUUID();
  const recruiter = await prisma.user.create({ data: { email: `chat-recruiter-${suffix}@example.test`, passwordHash: 'test', role: 'RECRUITER' } });
  const seeker = await prisma.user.create({ data: { email: `chat-seeker-${suffix}@example.test`, passwordHash: 'test', role: 'SEEKER', chatEmailNotifications: false } });
  const outsider = await prisma.user.create({ data: { email: `chat-outsider-${suffix}@example.test`, passwordHash: 'test', role: 'SEEKER' } });

  try {
    const vacancy = await prisma.vacancy.create({ data: { recruiterId: recruiter.id, title: 'Chat test vacancy', description: 'Test description', requirements: 'Test requirements', position: 'Full-time', company: 'Example', location: 'Remote', currency: 'USD' } });
    const application = await prisma.application.create({ data: { userId: seeker.id, vacancyId: vacancy.id, status: 'APPLIED' } });
    assert.equal(await chatRepository.findParticipantApplication(application.id, outsider.id), null);
    await assert.rejects(
      chatService.getThread(outsider.id, application.id, { limit: 30 }),
      (error: unknown) => error instanceof Error && error.message === 'Conversation not found',
    );

    const clientMessageId = randomUUID();
    const [firstAttempt, secondAttempt] = await Promise.all([
      chatRepository.createMessage({ applicationId: application.id, senderId: seeker.id, clientMessageId, content: 'Private integration message' }),
      chatRepository.createMessage({ applicationId: application.id, senderId: seeker.id, clientMessageId, content: 'Private integration message' }),
    ]);
    const first = firstAttempt.kind === 'CREATED' ? firstAttempt : secondAttempt;
    const duplicate = firstAttempt.kind === 'EXISTING' ? firstAttempt : secondAttempt;
    assert.equal(first.kind, 'CREATED');
    assert.equal(duplicate.kind, 'EXISTING');
    if (first.kind !== 'CREATED') throw new Error('Expected created message');
    assert.equal(first.notification.message.includes('Private integration message'), false);
    assert.equal(first.scheduledEmailAt?.getTime(), first.message.createdAt.getTime() + 4 * 60 * 60 * 1000);
    assert.equal(await prisma.applicationMessage.count({ where: { applicationId: application.id } }), 1);
    assert.equal(await prisma.notification.count({ where: { applicationId: application.id, type: 'NEW_MESSAGE' } }), 1);

    const recruiterState = await prisma.applicationChatState.findUniqueOrThrow({ where: { applicationId_userId: { applicationId: application.id, userId: recruiter.id } } });
    assert.equal(recruiterState.unreadCount, 1);
    const read = await chatRepository.markRead(application.id, recruiter.id, first.message.id);
    assert.equal(read.kind, 'UPDATED');
    assert.equal(read.state.unreadCount, 0);

    const second = await chatRepository.createMessage({ applicationId: application.id, senderId: seeker.id, clientMessageId: randomUUID(), content: 'Second message' });
    const third = await chatRepository.createMessage({ applicationId: application.id, senderId: seeker.id, clientMessageId: randomUUID(), content: 'Third message' });
    if (second.kind !== 'CREATED' || third.kind !== 'CREATED') throw new Error('Expected created messages');
    const latestRead = await chatRepository.markRead(application.id, recruiter.id, third.message.id);
    assert.equal(latestRead.kind, 'UPDATED');
    if (latestRead.kind !== 'UPDATED') throw new Error('Expected updated read state');
    assert.equal(latestRead.state.unreadCount, 0);
    const olderRead = await chatRepository.markRead(application.id, recruiter.id, first.message.id);
    assert.equal(olderRead.kind, 'UNCHANGED');
    assert.equal(olderRead.state.unreadCount, 0);

    await prisma.application.update({ where: { id: application.id }, data: { status: 'REJECTED' } });
    const blocked = await chatRepository.createMessage({ applicationId: application.id, senderId: recruiter.id, clientMessageId: randomUUID(), content: 'Must not be stored' });
    assert.equal(blocked.kind, 'READ_ONLY');
    const denied = await chatRepository.createMessage({ applicationId: application.id, senderId: outsider.id, clientMessageId: randomUUID(), content: 'Must not be stored' });
    assert.equal(denied.kind, 'NOT_FOUND');
    assert.equal(await prisma.applicationMessage.count({ where: { applicationId: application.id } }), 3);
    const readOnlyThread = await chatService.getThread(recruiter.id, application.id, { limit: 30 });
    assert.equal(readOnlyThread.canSend, false);
    assert.equal(readOnlyThread.messages.length, 3);
    assert.equal(readOnlyThread.peerLastReadCursor?.id, third.message.id);
    const seekerThread = await chatService.getThread(seeker.id, application.id, { limit: 30 });
    assert.equal(seekerThread.peerLastReadCursor?.id, third.message.id);
    assert.equal(seekerThread.peerLastReadCursor?.createdAt, third.message.createdAt.toISOString());
    await prisma.application.delete({ where: { id: application.id } });
    assert.equal(await prisma.applicationMessage.count({ where: { applicationId: application.id } }), 0);
  } finally {
    await prisma.user.deleteMany({ where: { id: { in: [recruiter.id, seeker.id, outsider.id] } } });
    await prisma.$disconnect();
  }
});
