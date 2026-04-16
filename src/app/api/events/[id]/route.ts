// src/app/api/events/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/roles";
import { z } from "zod";

const updateSchema = z.object({
  entityName: z.string().min(2).max(200).optional(),
  bio:        z.string().optional(),
  imageUrl:   z.string().nullable().optional(),
  status:     z.enum(["draft", "published", "cancelled", "completed"]).optional(),
  startTime:  z.string().datetime().optional(),
  endTime:    z.string().datetime().optional(),
  capacity:   z.number().int().positive().optional(),
  venueId:    z.string().optional(),
});

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      venue: true,
      org: true,
      sessions: { orderBy: { startTime: "asc" } },
      ticketTypes: true,
      orders: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { orderTime: "desc" },
        take: 20,
      },
    },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(event);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only organizers and above can update events
  if (!canAccess(session.user.role, "organizer")) {
    return NextResponse.json({ error: "Insufficient permissions. Organizer role required." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const event = await prisma.event.update({
    where: { id: eventId },
    data: parsed.data,
  });

  await prisma.assistLog.create({
    data: {
      userId: session.user.id!,
      eventId: event.id,
      entityName: "Event",
      action: "updated",
      metadata: JSON.stringify(parsed.data),
    },
  });

  return NextResponse.json(event);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only admins and above can delete events
  if (!canAccess(session.user.role, "admin")) {
    return NextResponse.json({ error: "Insufficient permissions. Admin role required." }, { status: 403 });
  }

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
