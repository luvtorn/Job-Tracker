import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;

  // Allow auth routes without token
  if (pathname.startsWith("/auth/")) {
    if (accessToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Public routes - allow without auth
  if (pathname === "/" || pathname.startsWith("/jobs")) {
    return NextResponse.next();
  }

  // Protected routes - require auth
  if (!accessToken) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|public|favicon|api).*)"],
};
