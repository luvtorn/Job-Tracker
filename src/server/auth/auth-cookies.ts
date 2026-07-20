import { NextResponse } from "next/server";

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setAuthCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string; refreshTokenExpiresAt: Date },
) {
  response.cookies.set("accessToken", tokens.accessToken, {
    ...baseCookieOptions,
    maxAge: 60 * 60,
  });
  response.cookies.set("refreshToken", tokens.refreshToken, {
    ...baseCookieOptions,
    maxAge: Math.max(0, Math.floor((tokens.refreshTokenExpiresAt.getTime() - Date.now()) / 1000)),
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set("accessToken", "", { ...baseCookieOptions, maxAge: 0 });
  response.cookies.set("refreshToken", "", { ...baseCookieOptions, maxAge: 0 });
}
