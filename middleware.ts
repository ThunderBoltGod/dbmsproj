// middleware.ts (root of project)
// Protects all dashboard routes — unauthenticated users are redirected to /login

export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register).*)"],
};
