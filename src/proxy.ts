import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/server/services/access-token-service";
import { env } from "@/server/config/env";
import { isTrustedMutationRequest } from "@/server/security/request-security";
import { buildContentSecurityPolicy } from "@/server/security/security-headers";

const isValidAccessToken = (token?: string) => {
  if (!token) return false;
  try {
    verifyAccessToken(token);
    return true;
  } catch {
    return false;
  }
};

const AUTH_ENTRY_PATHS = new Set(['/auth/login', '/auth/register']);
const CSRF_EXEMPT_PATHS = new Set([
  '/api/admin/cleanup-vacancies',
  '/api/integrations/cloudinary/malware-scan',
]);

const withPageSecurity = (request: NextRequest, response: NextResponse) => {
  const nonce = btoa(crypto.randomUUID());
  const policy = buildContentSecurityPolicy(nonce, process.env.NODE_ENV === 'development');
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', policy);
  response.headers.set('Content-Security-Policy', policy);
  return { requestHeaders, response };
};

const nextPageResponse = (request: NextRequest) => {
  const nonce = btoa(crypto.randomUUID());
  const policy = buildContentSecurityPolicy(nonce, process.env.NODE_ENV === 'development');
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', policy);
  return response;
};

const redirectPageResponse = (request: NextRequest, path: string) => {
  const response = NextResponse.redirect(new URL(path, request.url));
  return withPageSecurity(request, response).response;
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/api/')) {
    const isTrusted = CSRF_EXEMPT_PATHS.has(pathname) || isTrustedMutationRequest({
      method: request.method,
      origin: request.headers.get('origin'),
      secFetchSite: request.headers.get('sec-fetch-site'),
      allowedOrigins: env.trustedAppOrigins,
    });
    if (!isTrusted) {
      return NextResponse.json(
        { success: false, message: 'Invalid request origin' },
        { status: 403, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    const response = NextResponse.next();
    if (!pathname.startsWith('/api/jobs') && pathname !== '/api/locale') {
      response.headers.set('Cache-Control', 'no-store');
    }
    return response;
  }

  const hasValidToken = isValidAccessToken(request.cookies.get("accessToken")?.value);
  const hasRefreshToken = Boolean(request.cookies.get("refreshToken")?.value);

  if (pathname.startsWith("/auth/")) {
    return hasValidToken && AUTH_ENTRY_PATHS.has(pathname)
      ? redirectPageResponse(request, "/dashboard")
      : nextPageResponse(request);
  }
  if (pathname === "/" || pathname === "/privacy" || pathname.startsWith("/jobs")) {
    return nextPageResponse(request);
  }
  if (!hasValidToken && !hasRefreshToken) {
    return redirectPageResponse(request, "/auth/login");
  }
  return nextPageResponse(request);
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next|public|favicon|api).*)"],
};
