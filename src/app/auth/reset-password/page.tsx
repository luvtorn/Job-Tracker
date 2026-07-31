import { AuthPageShell } from '@/features/auth/components/auth-page-shell';
import { ResetPasswordCard } from '@/features/auth/components/reset-password-card';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <AuthPageShell><ResetPasswordCard token={token} /></AuthPageShell>;
}
