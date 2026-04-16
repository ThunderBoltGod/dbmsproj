// src/app/(auth)/register/page.tsx
// With Google OAuth, registration happens automatically on first sign-in.
// This page redirects to login.

import { redirect } from "next/navigation";

export default function RegisterPage() {
  redirect("/login");
}
