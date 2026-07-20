import { forbidden, unauthorized } from '@/server/errors/application-error';
import { verifyAuth } from '@/server/middleware/auth';

export async function requireSeeker() {
  const user = await verifyAuth();
  if (!user) throw unauthorized();
  if (user.role !== 'SEEKER') throw forbidden('Only seekers can access this workspace');
  return user;
}
