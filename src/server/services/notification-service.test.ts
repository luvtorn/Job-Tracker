import assert from 'node:assert/strict';
import test from 'node:test';
import type { Notification } from '@prisma/client';
import { toNotificationDto } from './notification-formatter';

const baseNotification: Notification = {
  id: '9c928b3a-3cb0-4ced-8256-d40ce0fe0599',
  type: 'APPLICATION_STATUS_CHANGED',
  title: 'Application Status Updated',
  message: 'Fallback message',
  isRead: false,
  createdAt: new Date('2026-07-21T10:00:00.000Z'),
  userId: '2250cf91-d420-4202-829f-09a15dd7758a',
  applicationId: '74e2bcec-1abb-41b3-b0c5-e8678825a822',
  vacancyId: '914c56cc-7cd9-47d0-b809-df3cf60f7b41',
  metadata: {
    kind: 'APPLICATION_STATUS_CHANGED',
    status: 'INTERVIEWING',
    vacancyTitle: 'Frontend Developer',
    company: 'Acme',
  },
};

test('formats structured notification with a safe application action', () => {
  const dto = toNotificationDto(baseNotification);
  assert.equal(dto.titleKey, 'statusChangedTitle');
  assert.equal(dto.params.vacancy, 'Frontend Developer');
  assert.deepEqual(dto.action, { href: '/applications', labelKey: 'viewApplication' });
});

test('keeps legacy text and derives only a safe action without metadata', () => {
  const dto = toNotificationDto({ ...baseNotification, metadata: null });
  assert.equal(dto.titleKey, null);
  assert.equal(dto.title, 'Application Status Updated');
  assert.deepEqual(dto.action, { href: '/applications', labelKey: 'viewApplication' });
});
