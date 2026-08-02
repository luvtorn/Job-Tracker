import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/server/errors/application-error';
import { requireAuthenticatedUser } from '@/server/middleware/role-auth';
import { authService } from '@/server/services/auth-service';

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    const refreshToken = (await cookies()).get('refreshToken')?.value;
    const sessions = await authService.listSessions(user.id, refreshToken);
    return NextResponse.json(
      { success: true, sessions },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return handleApiError(error, 'Failed to list active sessions');
  }
}
