// src/app/api/volunteers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/roles";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only admins+ can view all volunteer applications
  if (!canAccess(session.user.role, "admin")) {
    return NextResponse.json({ error: "Insufficient permissions. Admin role required." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("event");

  const applications = await prisma.volunteerApplication.findMany({
    where: eventId ? { eventId } : {},
    orderBy: { appliedAt: "desc" },
    include: {
      user:  { select: { name: true, email: true, phone: true } },
      event: { select: { entityName: true } },
    },
  });
  return NextResponse.json(applications);
}

// Apply to volunteer for an event — any authenticated user can apply
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const schema = z.object({
    eventId: z.string(),
    notes:   z.string().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  // Check for existing application
  const existing = await prisma.volunteerApplication.findUnique({
    where: { userId_eventId: { userId: session.user.id!, eventId: parsed.data.eventId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already applied for this event." }, { status: 409 });
  }

  const application = await prisma.volunteerApplication.create({
    data: {
      userId:  session.user.id!,
      eventId: parsed.data.eventId,
      notes:   parsed.data.notes,
      status:  "pending",
    },
  });

  return NextResponse.json(application, { status: 201 });
}
