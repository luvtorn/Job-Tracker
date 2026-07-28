import { AuthPageShell } from '@/features/auth/components/auth-page-shell';
import { VerifyEmailCard } from '@/features/auth/components/verify-email-card';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; delivery?: string }>;
}) {
  const { token, delivery } = await searchParams;
  return (
    <AuthPageShell>
      <VerifyEmailCard token={token} deliveryUnavailable={delivery === 'unavailable'} />
    </AuthPageShell>
  );
}
