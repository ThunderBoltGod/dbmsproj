// src/types/next-auth.d.ts
// Extends NextAuth's built-in types so TypeScript knows about our custom fields

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
}
