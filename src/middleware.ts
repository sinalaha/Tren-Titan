import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { auth } from "@/auth";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/settings",
  "/coach",
  "/training",
  "/nutrition",
  "/admin",
  "/scan"
];
const AUTH_PAGES = ["/login", "/register"];

type AuthenticatedRequest = Request & {
  nextUrl: URL;
  auth?: { user?: { id?: string } };
};

export default auth(async (req: AuthenticatedRequest) => {
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/api/admin")) {
    const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
    const token = await getToken({
      req,
      secret,
      secureCookie: process.env.NODE_ENV === "production"
    });
    if (!token?.sub) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const role = typeof token.role === "string" ? token.role : "USER";
    if (role !== "ADMIN" && role !== "SUPERADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  const isAuthenticated = Boolean(req.auth?.user);

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page));

  if (isProtected && !isAuthenticated) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)", "/api/admin/:path*"]
};
