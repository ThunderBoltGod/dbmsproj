// src/app/api/auth/register/route.ts
// Registration is handled automatically by Google OAuth on first sign-in.
// This route is kept for backward compatibility but returns a redirect message.

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Registration is handled via Google sign-in. Please use the login page." },
    { status: 400 }
  );
}
