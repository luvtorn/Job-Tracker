import type { AppLocale } from '@/i18n/config';
import { env } from '@/server/config/env';

type EmailCopy = {
  verifySubject: string;
  verifyTitle: string;
  verifyBody: string;
  verifyAction: string;
  resetSubject: string;
  resetTitle: string;
  resetBody: string;
  resetAction: string;
  expiry: string;
  ignore: string;
};

const copy: Record<AppLocale, EmailCopy> = {
  en: {
    verifySubject: 'Confirm your JobTracker email',
    verifyTitle: 'Confirm your email',
    verifyBody: 'Confirm your email address to start using your JobTracker workspace.',
    verifyAction: 'Confirm email',
    resetSubject: 'Reset your JobTracker password',
    resetTitle: 'Reset your password',
    resetBody: 'Use the secure link below to choose a new password.',
    resetAction: 'Reset password',
    expiry: 'This link expires automatically.',
    ignore: 'If you did not request this email, you can safely ignore it.',
  },
  pl: {
    verifySubject: 'Potwierdź adres e-mail w JobTracker',
    verifyTitle: 'Potwierdź swój adres e-mail',
    verifyBody: 'Potwierdź adres e-mail, aby rozpocząć korzystanie z JobTracker.',
    verifyAction: 'Potwierdź e-mail',
    resetSubject: 'Zresetuj hasło JobTracker',
    resetTitle: 'Zresetuj hasło',
    resetBody: 'Użyj bezpiecznego linku poniżej, aby ustawić nowe hasło.',
    resetAction: 'Zresetuj hasło',
    expiry: 'Ten link wygaśnie automatycznie.',
    ignore: 'Jeśli nie prosisz o tę wiadomość, możesz ją bezpiecznie zignorować.',
  },
  ru: {
    verifySubject: 'Подтвердите email в JobTracker',
    verifyTitle: 'Подтвердите email',
    verifyBody: 'Подтвердите адрес электронной почты, чтобы начать пользоваться JobTracker.',
    verifyAction: 'Подтвердить email',
    resetSubject: 'Сброс пароля JobTracker',
    resetTitle: 'Сбросьте пароль',
    resetBody: 'Используйте безопасную ссылку ниже, чтобы задать новый пароль.',
    resetAction: 'Сбросить пароль',
    expiry: 'Срок действия ссылки ограничен.',
    ignore: 'Если вы не запрашивали это письмо, просто проигнорируйте его.',
  },
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character] ?? character);

const emailHtml = (title: string, body: string, action: string, url: string, footer: EmailCopy) => `
<!doctype html>
<html>
  <body style="margin:0;background:#f5f3ff;font-family:Arial,sans-serif;color:#171717">
    <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;padding:32px">
      <div style="font-size:20px;font-weight:700;color:#7c3aed;margin-bottom:24px">JobTracker</div>
      <h1 style="font-size:24px;margin:0 0 16px">${escapeHtml(title)}</h1>
      <p style="line-height:1.6;margin:0 0 24px">${escapeHtml(body)}</p>
      <a href="${escapeHtml(url)}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">${escapeHtml(action)}</a>
      <p style="font-size:13px;color:#737373;line-height:1.5;margin:24px 0 0">${escapeHtml(footer.expiry)} ${escapeHtml(footer.ignore)}</p>
    </div>
  </body>
</html>`;

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = env.resendApiKey;
  const from = env.emailFrom;
  if (!apiKey || !from) return false;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!response.ok) throw new Error('Email delivery failed');
  return true;
}

export const authEmailService = {
  sendVerification(email: string, token: string, locale: AppLocale) {
    const localized = copy[locale];
    const url = `${env.appUrl}/auth/verify-email#token=${encodeURIComponent(token)}`;
    return sendEmail(
      email,
      localized.verifySubject,
      emailHtml(localized.verifyTitle, localized.verifyBody, localized.verifyAction, url, localized),
    );
  },

  sendPasswordReset(email: string, token: string, locale: AppLocale) {
    const localized = copy[locale];
    const url = `${env.appUrl}/auth/reset-password#token=${encodeURIComponent(token)}`;
    return sendEmail(
      email,
      localized.resetSubject,
      emailHtml(localized.resetTitle, localized.resetBody, localized.resetAction, url, localized),
    );
  },
};
