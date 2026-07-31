import { NextRequest, NextResponse } from 'next/server';

const FLOW_COOKIE = 'oauthFlow';
export const OAUTH_REGISTRATION_COOKIE = 'oauthRegistration';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 10 * 60,
};

export const getOAuthFlowCookie = (request: NextRequest) =>
  request.cookies.get(FLOW_COOKIE)?.value;

export const setOAuthFlowCookie = (response: NextResponse, value: string) => {
  response.cookies.set(FLOW_COOKIE, value, { ...cookieOptions, path: '/api/auth/oauth' });
};

export const clearOAuthFlowCookie = (response: NextResponse) => {
  response.cookies.set(FLOW_COOKIE, '', { ...cookieOptions, path: '/api/auth/oauth', maxAge: 0 });
};

export const getOAuthRegistrationCookie = (request: NextRequest) =>
  request.cookies.get(OAUTH_REGISTRATION_COOKIE)?.value;

export const setOAuthRegistrationCookie = (response: NextResponse, value: string) => {
  response.cookies.set(OAUTH_REGISTRATION_COOKIE, value, { ...cookieOptions, path: '/' });
};

export const clearOAuthRegistrationCookie = (response: NextResponse) => {
  response.cookies.set(OAUTH_REGISTRATION_COOKIE, '', { ...cookieOptions, path: '/', maxAge: 0 });
};
