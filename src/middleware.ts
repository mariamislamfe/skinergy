import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// A separate, edge-safe NextAuth instance — deliberately not the one from
// @/lib/auth, which pulls in Prisma + bcrypt and is too large for Vercel's
// Edge middleware size limit.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$|.*\\.svg$|.*\\.ico$).*)"],
};
