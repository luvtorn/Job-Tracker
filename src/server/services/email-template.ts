const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character] ?? character);

export const createActionEmailHtml = (input: {
  title: string;
  body: string;
  action: string;
  url: string;
  footer: string;
}) => `
<!doctype html>
<html>
  <body style="margin:0;background:#f5f3ff;font-family:Arial,sans-serif;color:#171717">
    <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;padding:32px">
      <div style="font-size:20px;font-weight:700;color:#7c3aed;margin-bottom:24px">JobTracker</div>
      <h1 style="font-size:24px;margin:0 0 16px">${escapeHtml(input.title)}</h1>
      <p style="line-height:1.6;margin:0 0 24px">${escapeHtml(input.body)}</p>
      <a href="${escapeHtml(input.url)}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">${escapeHtml(input.action)}</a>
      <p style="font-size:13px;color:#737373;line-height:1.5;margin:24px 0 0">${escapeHtml(input.footer)}</p>
    </div>
  </body>
</html>`;
