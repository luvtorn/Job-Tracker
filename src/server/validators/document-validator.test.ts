import assert from 'node:assert/strict';
import test from 'node:test';
import { documentUploadIntentSchema } from './document-validator';

test('accepts bounded PDF and DOCX upload intents', () => {
  assert.equal(documentUploadIntentSchema.safeParse({
    type: 'RESUME',
    originalFilename: 'resume.pdf',
    contentType: 'application/pdf',
    size: 1024,
  }).success, true);
  assert.equal(documentUploadIntentSchema.safeParse({
    type: 'COVER_LETTER',
    originalFilename: 'letter.docx',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 2048,
  }).success, true);
});

test('rejects traversal names, mismatched extensions, and oversized files', () => {
  for (const input of [
    {
      type: 'RESUME',
      originalFilename: '../resume.pdf',
      contentType: 'application/pdf',
      size: 1024,
    },
    {
      type: 'RESUME',
      originalFilename: 'resume.docx',
      contentType: 'application/pdf',
      size: 1024,
    },
    {
      type: 'RESUME',
      originalFilename: 'resume.pdf',
      contentType: 'application/pdf',
      size: 11 * 1024 * 1024,
    },
  ]) {
    assert.equal(documentUploadIntentSchema.safeParse(input).success, false);
  }
});
