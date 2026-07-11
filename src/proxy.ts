import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

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
  "/locus_",
  "/be-nice",
  "/sw.js",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth?.user?.id;
  const isPublic = PUBLIC_PATHS.has(pathname);
  const isAuthPage = AUTH_PATHS.includes(pathname);

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  const res = NextResponse.next();
  if (req.auth?.user?.id) {
    res.headers.set("x-user-id", req.auth.user.id);
  }
  const orgId = req.cookies.get("active-org-id")?.value;
  if (orgId) {
    res.headers.set("x-org-id", orgId);
  }
  return res;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
