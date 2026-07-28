import { AuthProvider } from '@prisma/client';
import { NextResponse } from 'next/server';
import { authService } from '@/server/services/auth-service';
import { requireAuthenticatedUser } from '@/server/middleware/role-auth';
import { authProviderParamSchema } from '@/server/validators/auth-validator';
import { handleApiError } from '@/server/errors/application-error';

const resourceIdSchema = authProviderParamSchema;

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  try {
    const user = await requireAuthenticatedUser();
    const { provider } = resourceIdSchema.parse(await context.params);
    await authService.disconnectOAuthAccount(
      user.id,
      provider === 'google' ? AuthProvider.GOOGLE : AuthProvider.GITHUB,
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'Failed to disconnect OAuth account');
  }
}
