import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      defaultMode: string;
      avatarColor: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    defaultMode: string;
    avatarColor: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    defaultMode: string;
    avatarColor: string;
  }
}
