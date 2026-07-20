import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/server/services/access-token-service";

const isValidAccessToken = (token?: string) => {
  if (!token) return false;
  try {
    verifyAccessToken(token);
    return true;
  } catch {
    return false;
  }
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasValidToken = isValidAccessToken(request.cookies.get("accessToken")?.value);
  const hasRefreshToken = Boolean(request.cookies.get("refreshToken")?.value);

  if (pathname.startsWith("/auth/")) {
    return hasValidToken
      ? NextResponse.redirect(new URL("/dashboard", request.url))
      : NextResponse.next();
  }
  if (pathname === "/" || pathname.startsWith("/jobs")) return NextResponse.next();
  if (!hasValidToken && !hasRefreshToken) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|public|favicon|api).*)"],
};
