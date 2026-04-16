// src/app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/roles";
import { z } from "zod";

const createEventSchema = z.object({
  orgId:      z.string(),
  venueId:    z.string().optional(),
  entityName: z.string().min(2).max(200),
  bio:        z.string().optional(),
  imageUrl:   z.string().optional(),
  status:     z.enum(["draft", "published", "cancelled", "completed"]).default("draft"),
  startTime:  z.string().datetime(),
  endTime:    z.string().datetime(),
  capacity:   z.number().int().positive().optional(),
});

export async function GET() {
  // All authenticated users can view events
  const events = await prisma.event.findMany({
    orderBy: { startTime: "asc" },
    include: {
      venue: true,
      org:   { select: { name: true } },
      _count: { select: { orders: true, volunteerApplications: true } },
    },
  });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only organizers and above can create events
    if (!canAccess(session.user.role, "organizer")) {
      return NextResponse.json({ error: "Insufficient permissions. Organizer role required." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: { ...parsed.data, createdBy: session.user.id! },
    });

    // Audit log
    await prisma.assistLog.create({
      data: {
        userId: session.user.id!,
        eventId: event.id,
        orgId: event.orgId,
        entityName: "Event",
        action: "created",
        metadata: JSON.stringify({ eventName: event.entityName }),
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    console.error("Event creation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create event" },
      { status: 500 }
    );
  }
}

