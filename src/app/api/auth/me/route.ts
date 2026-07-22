import { NextResponse } from 'next/server';
import { handleApiError } from '@/server/errors/application-error';
import { requireAuthenticatedUser } from '@/server/middleware/role-auth';

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return handleApiError(error, 'Failed to get current user');
  }
}
