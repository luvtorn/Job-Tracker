export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

export const isReportedDocumentTooLarge = (reportedBytes: number) =>
  reportedBytes > MAX_DOCUMENT_SIZE;

export const hasDocumentSizeMismatch = (
  actualBytes: number,
  reportedBytes: number,
) => reportedBytes > 0 && actualBytes !== reportedBytes;

export async function readDocumentContent(
  response: Response,
  maxBytes = MAX_DOCUMENT_SIZE,
): Promise<Buffer | null> {
  if (!response.body) return null;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  if (totalBytes === 0) return null;
  return Buffer.concat(chunks, totalBytes);
}
