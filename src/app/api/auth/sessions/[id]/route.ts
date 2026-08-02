import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies } from '@/server/auth/auth-cookies';
import { handleApiError } from '@/server/errors/application-error';
import { requireAuthenticatedUser } from '@/server/middleware/role-auth';
import { authService } from '@/server/services/auth-service';
import { sessionIdSchema } from '@/server/validators/auth-validator';

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const user = await requireAuthenticatedUser();
    const familyId = sessionIdSchema.parse((await params).id);
    const refreshToken = (await cookies()).get('refreshToken')?.value;
    const result = await authService.revokeSession(user.id, familyId, refreshToken);
    const response = NextResponse.json({ success: true, signedOut: result.isCurrent });
    if (result.isCurrent) clearAuthCookies(response);
    return response;
  } catch (error) {
    return handleApiError(error, 'Failed to revoke session');
  }
}
