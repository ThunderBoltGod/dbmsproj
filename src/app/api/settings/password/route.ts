// src/app/api/settings/password/route.ts
// Password management is not available for Google OAuth users.
// This route returns a friendly message.

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Password management is not available. Your account uses Google sign-in." },
    { status: 400 }
  );
}
