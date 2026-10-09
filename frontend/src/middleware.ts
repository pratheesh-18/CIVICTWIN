import { NextResponse, NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("civictwin_session");

  const protectedRoutes = ["/dashboard", "/report", "/officer", "/ticket"];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  // If trying to access protected route without session cookie, redirect to /
  if (isProtected && !sessionCookie) {
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/report/:path*",
    "/officer/:path*",
    "/ticket/:path*",
  ],
};
