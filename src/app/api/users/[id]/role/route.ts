// src/app/api/users/[id]/role/route.ts
// Change a user's role — super_admin only
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/roles";
import type { UserRole } from "@/lib/roles";
import { ALL_ROLES } from "@/lib/roles";
import { z } from "zod";

const schema = z.object({
  role: z.enum(["super_admin", "admin", "organizer", "volunteer", "attendee"]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only super_admin can change user roles
  if (session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Only Super Admins can change user roles." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role. Valid: " + ALL_ROLES.join(", ") }, { status: 400 });
  }

  // Prevent changing your own role (safety)
  if (id === session.user.id) {
    return NextResponse.json({ error: "Cannot change your own role." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: parsed.data.role },
    select: { id: true, name: true, email: true, role: true },
  });

  // Audit log
  await prisma.assistLog.create({
    data: {
      userId: session.user.id!,
      entityName: "UserRole",
      action: "changed",
      metadata: JSON.stringify({ targetUser: user.email, newRole: parsed.data.role }),
    },
  });

  return NextResponse.json(user);
}
