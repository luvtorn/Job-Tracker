import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/server/validators/auth-validator';
import { authService } from '@/server/services/auth-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validatedData = loginSchema.parse(body);

    const result = await authService.login(validatedData);

    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: result.user,
      },
      { status: 200 }
    );

    // Set HttpOnly cookies
    response.cookies.set('accessToken', result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    response.cookies.set('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invalid credentials' || error.message === 'Account has been deleted') {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
