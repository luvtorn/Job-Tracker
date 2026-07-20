import assert from 'node:assert/strict';
import test from 'node:test';
import { createContentDisposition } from './content-disposition';

test('creates a ByteString-safe fallback for unicode filenames', () => {
  const value = createContentDisposition('inline', 'Резюме Иван.pdf');
  assert.match(value, /^inline; filename="[\x20-\x7E]+";/);
  assert.match(value, /filename\*=UTF-8''%D0%A0/);
});

test('preserves disposition and escapes quotes in the ASCII fallback', () => {
  const value = createContentDisposition('attachment', 'my "resume".pdf');
  assert.match(value, /^attachment; filename="my _resume_\.pdf";/);
});
