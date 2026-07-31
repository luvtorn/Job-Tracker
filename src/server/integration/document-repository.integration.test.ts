import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const canUseTestDatabase = Boolean(testDatabaseUrl && /test/i.test(testDatabaseUrl));

test('document upload IDs and removal lifecycle remain consistent', {
  skip: canUseTestDatabase
    ? false
    : 'Set a dedicated TEST_DATABASE_URL containing "test" to run database integration tests',
}, async () => {
  process.env.DATABASE_URL = testDatabaseUrl;
  const [
    { DocumentScanStatus, DocumentType },
    { prisma },
    { documentRepository },
    { documentService },
  ] = await Promise.all([
    import('@prisma/client'),
    import('@/lib/prisma'),
    import('@/server/repositories/document-repository'),
    import('@/server/services/document-service'),
  ]);

  const suffix = randomUUID();
  const seeker = await prisma.user.create({
    data: {
      email: `document-${suffix}@example.test`,
      passwordHash: 'integration-test',
      role: 'SEEKER',
    },
  });
  const recruiter = await prisma.user.create({
    data: {
      email: `document-recruiter-${suffix}@example.test`,
      passwordHash: 'integration-test',
      role: 'RECRUITER',
    },
  });

  try {
    const pdfIntent = await documentService.createUploadIntent(seeker.id, {
      type: DocumentType.RESUME,
      originalFilename: 'resume.pdf',
      contentType: 'application/pdf',
      size: 128,
    });
    assert.match(pdfIntent.document.publicId, /\.pdf$/);
    assert.equal(pdfIntent.upload.fields.public_id, pdfIntent.document.publicId);

    const docxIntent = await documentService.createUploadIntent(seeker.id, {
      type: DocumentType.COVER_LETTER,
      originalFilename: 'cover-letter.docx',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 128,
    });
    assert.match(docxIntent.document.publicId, /\.docx$/);
    assert.equal(docxIntent.upload.fields.public_id, docxIntent.document.publicId);

    const scanningDocument = await prisma.document.create({
      data: {
        userId: seeker.id,
        type: DocumentType.RESUME,
        originalFilename: 'scanning-resume.pdf',
        publicId: `integration/documents/${suffix}/scanning`,
        isCurrent: false,
        scanStatus: DocumentScanStatus.SCANNING,
      },
    });

    assert.equal(
      (await documentRepository.findCurrentByUser(seeker.id))
        .some((document) => document.id === scanningDocument.id),
      true,
    );

    const removedScanningDocument = await documentRepository.removeFromProfile(
      scanningDocument.id,
      seeker.id,
    );
    assert.deepEqual(removedScanningDocument, {
      publicId: scanningDocument.publicId,
      destroyAsset: true,
    });
    assert.equal(
      await prisma.document.findUnique({ where: { id: scanningDocument.id } }),
      null,
    );
    assert.equal(
      (await documentRepository.findCurrentByUser(seeker.id))
        .some((document) => document.id === scanningDocument.id),
      false,
    );

    const cleanDocument = await prisma.document.create({
      data: {
        userId: seeker.id,
        type: DocumentType.RESUME,
        originalFilename: 'clean-resume.pdf',
        publicId: `integration/documents/${suffix}/clean`,
        isCurrent: true,
        scanStatus: DocumentScanStatus.CLEAN,
      },
    });

    const removedCleanDocument = await documentRepository.removeFromProfile(
      cleanDocument.id,
      seeker.id,
    );
    assert.deepEqual(removedCleanDocument, {
      publicId: cleanDocument.publicId,
      destroyAsset: true,
    });
    assert.equal(
      await prisma.document.findUnique({ where: { id: cleanDocument.id } }),
      null,
    );

    const applicationDocument = await prisma.document.create({
      data: {
        userId: seeker.id,
        type: DocumentType.RESUME,
        originalFilename: 'application-resume.pdf',
        publicId: `integration/documents/${suffix}/application`,
        isCurrent: true,
        scanStatus: DocumentScanStatus.CLEAN,
      },
    });
    const vacancy = await prisma.vacancy.create({
      data: {
        recruiterId: recruiter.id,
        title: 'Document integration vacancy',
        description: 'Document removal integration test vacancy.',
      },
    });
    await prisma.application.create({
      data: {
        userId: seeker.id,
        vacancyId: vacancy.id,
        documents: {
          create: {
            documentId: applicationDocument.id,
            type: DocumentType.RESUME,
          },
        },
      },
    });

    const removedApplicationDocument = await documentRepository.removeFromProfile(
      applicationDocument.id,
      seeker.id,
    );
    assert.deepEqual(removedApplicationDocument, {
      publicId: applicationDocument.publicId,
      destroyAsset: false,
    });
    assert.equal(
      (await prisma.document.findUnique({ where: { id: applicationDocument.id } }))?.isCurrent,
      false,
    );
    assert.equal(
      (await documentRepository.findCurrentByUser(seeker.id))
        .some((document) => document.id === applicationDocument.id),
      false,
    );
  } finally {
    await prisma.user.deleteMany({ where: { id: { in: [seeker.id, recruiter.id] } } });
    await prisma.$disconnect();
  }
});
