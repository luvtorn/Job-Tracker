import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthPageShell } from '@/features/auth/components/auth-page-shell';
import { CompleteOAuthRegistrationCard } from '@/features/auth/components/complete-oauth-registration-card';
import { OAUTH_REGISTRATION_COOKIE } from '@/server/auth/oauth-cookies';
import { oauthService } from '@/server/services/oauth-service';

export default async function CompleteRegistrationPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(OAUTH_REGISTRATION_COOKIE)?.value;
  if (!token) redirect('/auth/login?oauthError=1');

  let identity;
  try {
    identity = oauthService.readRegistrationIntent(token);
  } catch {
    redirect('/auth/login?oauthError=1');
  }

  return (
    <AuthPageShell>
      <CompleteOAuthRegistrationCard
        email={identity.email}
        initialFirstName={identity.firstName ?? ''}
        initialLastName={identity.lastName ?? ''}
      />
    </AuthPageShell>
  );
}
