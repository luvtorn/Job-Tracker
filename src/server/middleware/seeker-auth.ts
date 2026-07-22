import { forbidden } from '@/server/errors/application-error';
import { requireAuthenticatedUser } from '@/server/middleware/role-auth';

export async function requireSeeker() {
  const user = await requireAuthenticatedUser();
  if (user.role !== 'SEEKER') throw forbidden('Only seekers can access this workspace');
  return user;
}
