// src/app/api/events/[id]/ticket-types/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/roles";
import { z } from "zod";

const createSchema = z.object({
  name:        z.string().min(1).max(100),
  price:       z.number().min(0),
  maxQuantity: z.number().int().min(1).nullable().optional(),
});

const updateSchema = z.object({
  name:        z.string().min(1).max(100).optional(),
  price:       z.number().min(0).optional(),
  maxQuantity: z.number().int().min(1).nullable().optional(),
});

// GET all ticket types for an event
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;

  const ticketTypes = await prisma.ticketType.findMany({
    where: { eventId },
    include: { _count: { select: { orderItems: true } } },
    orderBy: { price: "asc" },
  });

  return NextResponse.json(ticketTypes);
}

// POST create a new ticket type
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.user.role, "organizer")) {
    return NextResponse.json({ error: "Organizer role required" }, { status: 403 });
  }

  // Verify event exists
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const ticketType = await prisma.ticketType.create({
    data: { eventId, ...parsed.data },
  });

  return NextResponse.json(ticketType, { status: 201 });
}

// PATCH update a ticket type (send ticketTypeId in body)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params; // consume params
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.user.role, "organizer")) {
    return NextResponse.json({ error: "Organizer role required" }, { status: 403 });
  }

  const body = await req.json();
  const { ticketTypeId, ...rest } = body;
  if (!ticketTypeId) return NextResponse.json({ error: "ticketTypeId required" }, { status: 400 });

  const parsed = updateSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const ticketType = await prisma.ticketType.update({
    where: { id: ticketTypeId },
    data: parsed.data,
  });

  return NextResponse.json(ticketType);
}

// DELETE a ticket type (send ticketTypeId in body)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.user.role, "organizer")) {
    return NextResponse.json({ error: "Organizer role required" }, { status: 403 });
  }

  const body = await req.json();
  const { ticketTypeId } = body;
  if (!ticketTypeId) return NextResponse.json({ error: "ticketTypeId required" }, { status: 400 });

  // Check if tickets have been sold
  const soldCount = await prisma.orderItem.count({ where: { ticketTypeId } });
  if (soldCount > 0) {
    return NextResponse.json({ error: `Cannot delete: ${soldCount} tickets already sold` }, { status: 409 });
  }

  await prisma.ticketType.delete({ where: { id: ticketTypeId } });
  return NextResponse.json({ ok: true });
}
