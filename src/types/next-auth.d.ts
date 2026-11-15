import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username?: string | null;
      role: "SUPERADMIN" | "ADMIN" | "GURU" | "MURID";
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    username?: string | null;
    role?: "SUPERADMIN" | "ADMIN" | "GURU" | "MURID";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string | null;
    role?: "SUPERADMIN" | "ADMIN" | "GURU" | "MURID";
  }
}

