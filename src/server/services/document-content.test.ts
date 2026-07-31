import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasDocumentSizeMismatch,
  isReportedDocumentTooLarge,
  readDocumentContent,
} from './document-content';

test('treats zero-byte provider metadata as unknown until content is read', () => {
  assert.equal(isReportedDocumentTooLarge(0), false);
  assert.equal(hasDocumentSizeMismatch(3, 0), false);
  assert.equal(hasDocumentSizeMismatch(3, 2), true);
});

test('reads a document when its actual content is within the limit', async () => {
  const content = await readDocumentContent(new Response('pdf'), 3);

  assert.equal(content?.toString(), 'pdf');
});

test('rejects empty document content', async () => {
  const content = await readDocumentContent(new Response(new Uint8Array()), 3);

  assert.equal(content, null);
});

test('stops reading document content after the limit is exceeded', async () => {
  const content = await readDocumentContent(new Response('oversized'), 3);

  assert.equal(content, null);
});
