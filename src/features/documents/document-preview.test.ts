import assert from 'node:assert/strict';
import test from 'node:test';
import { canPreviewDocument } from './document-preview';

test('allows PDF documents regardless of extension casing', () => {
  assert.equal(canPreviewDocument('resume.pdf'), true);
  assert.equal(canPreviewDocument('Resume.PDF'), true);
});

test('does not offer browser preview for DOCX or deceptive filenames', () => {
  assert.equal(canPreviewDocument('resume.docx'), false);
  assert.equal(canPreviewDocument('resume.pdf.docx'), false);
});
