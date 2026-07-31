import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'googleCalendarOAuth';
const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/integrations/google-calendar',
  maxAge: 10 * 60,
};

export const getGoogleCalendarOAuthCookie = (request: NextRequest) =>
  request.cookies.get(COOKIE_NAME)?.value;

export const setGoogleCalendarOAuthCookie = (response: NextResponse, value: string) => {
  response.cookies.set(COOKIE_NAME, value, options);
};

export const clearGoogleCalendarOAuthCookie = (response: NextResponse) => {
  response.cookies.set(COOKIE_NAME, '', { ...options, maxAge: 0 });
};
