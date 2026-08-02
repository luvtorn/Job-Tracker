import type { AppLocale } from '@/i18n/config';
import { env } from '@/server/config/env';
import { createActionEmailHtml } from '@/server/services/email-template';
import { sendResendEmail } from '@/server/services/resend-email-service';

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

async function sendEmail(to: string, subject: string, html: string) {
  return Boolean(await sendResendEmail({ to, subject, html }));
}

export const authEmailService = {
  sendVerification(email: string, token: string, locale: AppLocale) {
    const localized = copy[locale];
    const url = `${env.appUrl}/auth/verify-email#token=${encodeURIComponent(token)}`;
    return sendEmail(
      email,
      localized.verifySubject,
      createActionEmailHtml({
        title: localized.verifyTitle,
        body: localized.verifyBody,
        action: localized.verifyAction,
        url,
        footer: `${localized.expiry} ${localized.ignore}`,
      }),
    );
  },

  sendPasswordReset(email: string, token: string, locale: AppLocale) {
    const localized = copy[locale];
    const url = `${env.appUrl}/auth/reset-password#token=${encodeURIComponent(token)}`;
    return sendEmail(
      email,
      localized.resetSubject,
      createActionEmailHtml({
        title: localized.resetTitle,
        body: localized.resetBody,
        action: localized.resetAction,
        url,
        footer: `${localized.expiry} ${localized.ignore}`,
      }),
    );
  },
};
