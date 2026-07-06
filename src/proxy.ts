import { NextRequest, NextResponse } from "next/server";

const AUTH_PATHS = ["/login", "/signup"];
const PUBLIC_PATHS = new Set([
  "/",
  "/verify-email",
  "/verify-login",
  "/forgot-password",
  "/reset-password",
  ...AUTH_PATHS,
]);
const PUBLIC_PREFIXES = [
  "/api/auth",
  "/onboarding",
  "/invite",
  "/_next",
  "/favicon",
];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ??
    request.cookies.get("__Secure-authjs.session-token")?.value;

  const isLoggedIn = !!sessionToken;
  const isPublic = PUBLIC_PATHS.has(pathname);
  const isAuthPage = AUTH_PATHS.includes(pathname);

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
