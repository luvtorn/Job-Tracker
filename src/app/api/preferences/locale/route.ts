import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, locales } from '@/i18n/config';
import { handleApiError } from '@/server/errors/application-error';

const localeSchema = z.object({ locale: z.enum(locales) });

export async function POST(request: NextRequest) {
  try {
    const { locale } = localeSchema.parse(await request.json());
    const response = NextResponse.json({ success: true, locale });
    response.cookies.set(LOCALE_COOKIE, locale, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: LOCALE_COOKIE_MAX_AGE,
    });
    return response;
  } catch (error) {
    return handleApiError(error, 'Failed to update locale');
  }
}
