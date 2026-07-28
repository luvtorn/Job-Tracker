import { NextResponse } from 'next/server';
import { authService } from '@/server/services/auth-service';
import { requireAuthenticatedUser } from '@/server/middleware/role-auth';
import { handleApiError } from '@/server/errors/application-error';

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    const accounts = await authService.listConnectedAccounts(user.id);
    return NextResponse.json({
      success: true,
      accounts: accounts.map((account) => ({
        provider: account.provider.toLowerCase(),
        createdAt: account.createdAt,
      })),
      hasPassword: Boolean(user.passwordHash),
    });
  } catch (error) {
    return handleApiError(error, 'Failed to list connected accounts');
  }
}
