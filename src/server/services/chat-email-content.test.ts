import assert from 'node:assert/strict';
import test from 'node:test';
import { buildChatReminderEmail } from './chat-email-content';

test('chat reminder email contains context but never accepts message content', () => {
  const email = buildChatReminderEmail({ locale: 'en', senderName: '<script>Alex</script>', vacancyTitle: 'Frontend Developer', url: 'https://jobtracker.example/messages?applicationId=123' });
  assert.equal(email.subject, 'Unread message in JobTracker');
  assert.match(email.html, /Frontend Developer/);
  assert.doesNotMatch(email.html, /<script>/);
  assert.match(email.html, /&lt;script&gt;Alex&lt;\/script&gt;/);
  assert.equal('content' in email, false);
});

test('chat reminder email supports all saved locales and safe fallback', () => {
  for (const locale of ['en', 'pl', 'ru', 'unsupported']) {
    const email = buildChatReminderEmail({ locale, senderName: 'Alex', vacancyTitle: 'Developer', url: 'https://jobtracker.example/messages' });
    assert.ok(email.subject.length > 0);
    assert.match(email.html, /Alex/);
  }
});
