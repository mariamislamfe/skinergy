import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

/**
 * Edge-safe subset of the auth config — no providers, no Prisma, no
 * bcrypt. This is the only auth config middleware.ts may import: pulling
 * in the Credentials provider (which needs Prisma + bcrypt, both
 * Node-only) here bloats the Edge middleware bundle past Vercel's 1MB
 * limit. The full config with providers lives in auth.ts and is used
 * everywhere else (server components, actions, API routes).
 */
export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      const isPublic =
        pathname.startsWith("/login") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon");

      if (!isLoggedIn && !isPublic) {
        const loginUrl = new URL("/login", request.nextUrl.origin);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }

      if (isLoggedIn && pathname === "/login") {
        return NextResponse.redirect(new URL("/", request.nextUrl.origin));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
