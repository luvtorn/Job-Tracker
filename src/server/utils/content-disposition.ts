const getAsciiFilename = (filename: string) => {
  const sanitized = filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
  return sanitized || 'document';
};

export const createContentDisposition = (disposition: 'inline' | 'attachment', filename: string) =>
  `${disposition}; filename="${getAsciiFilename(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
