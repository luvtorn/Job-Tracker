import type { User, UserRole } from '@prisma/client';
import { forbidden, unauthorized } from '@/server/errors/application-error';
import { verifyAuth } from '@/server/middleware/auth';

export const requireAuthenticatedUser = async () => {
  const user = await verifyAuth();
  if (!user) throw unauthorized();
  return user;
};

export const requireRole = async <Role extends UserRole>(...roles: Role[]): Promise<User & { role: Role }> => {
  const user = await requireAuthenticatedUser();
  if (!roles.some((role) => role === user.role)) throw forbidden();
  return user as User & { role: Role };
};

export const requireRecruiter = () => requireRole('RECRUITER');
export const requireCalendarUser = () => requireRole('SEEKER', 'RECRUITER');
