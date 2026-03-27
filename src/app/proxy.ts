import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/signup", "/api/auth"];

export default auth((req: NextRequest) => {
  const { pathname } = req.nextUrl;

  const isPublic = publicPaths.some((path) => pathname.startsWith(path));

  const isAuthenticated = !!(req as unknown as { auth: unknown }).auth;

  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
