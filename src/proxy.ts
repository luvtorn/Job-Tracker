import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/server/services/access-token-service";
import { isTrustedMutationRequest, resolveRequestOrigin } from "@/server/security/request-security";

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
  if (pathname.startsWith('/api/')) {
    const isTrusted = pathname === '/api/admin/cleanup-vacancies' || isTrustedMutationRequest({
      method: request.method,
      origin: request.headers.get('origin'),
      secFetchSite: request.headers.get('sec-fetch-site'),
      requestOrigin: resolveRequestOrigin(
        request.nextUrl.origin,
        request.headers.get('host'),
        request.headers.get('x-forwarded-host'),
        request.headers.get('x-forwarded-proto'),
      ),
    });
    return isTrusted
      ? NextResponse.next()
      : NextResponse.json({ success: false, message: 'Invalid request origin' }, { status: 403 });
  }

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
  matcher: ["/api/:path*", "/((?!_next|public|favicon|api).*)"],
};
