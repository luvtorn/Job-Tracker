import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cloudinaryResourceSchema,
  documentUploadIntentSchema,
} from './document-validator';

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

test('accepts raw Cloudinary resource metadata without a separate format field', () => {
  const result = cloudinaryResourceSchema.safeParse({
    public_id: 'job-tracker/documents/user/document.pdf',
    bytes: 4096,
    resource_type: 'raw',
    type: 'authenticated',
    moderation: [{ kind: 'perception_point', status: 'pending' }],
  });

  assert.equal(result.success, true);
});
