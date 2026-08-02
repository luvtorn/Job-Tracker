import { z } from 'zod';
import { env } from '@/server/config/env';

const resendResponseSchema = z.object({ id: z.string().min(1) }).passthrough();

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  scheduledAt?: Date;
  idempotencyKey?: string;
};

export async function sendResendEmail(input: SendEmailInput) {
  const apiKey = env.resendApiKey;
  const from = env.emailFrom;
  if (!apiKey || !from) return null;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(input.idempotencyKey ? { 'Idempotency-Key': input.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      ...(input.scheduledAt ? { scheduled_at: input.scheduledAt.toISOString() } : {}),
    }),
  });
  if (!response.ok) throw new Error('Email delivery failed');
  return resendResponseSchema.parse(await response.json());
}

export async function cancelResendEmail(emailId: string) {
  const apiKey = env.resendApiKey;
  if (!apiKey) return false;
  const response = await fetch(`https://api.resend.com/emails/${encodeURIComponent(emailId)}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) throw new Error('Email cancellation failed');
  resendResponseSchema.parse(await response.json());
  return true;
}
