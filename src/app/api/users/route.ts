// src/app/api/users/route.ts
// List all users — super_admin and admin only
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/roles";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only admins+ can list users
  if (!canAccess(session.user.role, "admin")) {
    return NextResponse.json({ error: "Insufficient permissions." }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json(users);
}
