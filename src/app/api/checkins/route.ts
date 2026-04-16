// src/app/api/checkins/route.ts
// Used by the check-in station to scan QR codes
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/roles";
import { z } from "zod";

const checkinSchema = z.object({
  ticketCode: z.string(),
  sessionId:  z.string(),
  gate:       z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only volunteers+ can scan/check-in attendees
  if (!canAccess(session.user.role, "volunteer")) {
    return NextResponse.json({ error: "Insufficient permissions. Volunteer role required." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = checkinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { ticketCode, sessionId, gate } = parsed.data;

  // Look up the ticket
  const ticket = await prisma.ticket.findUnique({
    where: { ticketCode },
    include: {
      orderItem: { include: { order: true } },
    },
  });

  if (!ticket) {
    return NextResponse.json({ valid: false, reason: "Ticket not found" }, { status: 404 });
  }

  if (ticket.status === "used") {
    return NextResponse.json({ valid: false, reason: "Ticket already used" }, { status: 409 });
  }

  if (ticket.status === "cancelled") {
    return NextResponse.json({ valid: false, reason: "Ticket is cancelled" }, { status: 409 });
  }

  // Mark ticket as used + create checkin record in a transaction
  const [, checkin] = await prisma.$transaction([
    prisma.ticket.update({
      where: { id: ticket.id },
      data:  { status: "used" },
    }),
    prisma.checkin.create({
      data: {
        orderId:       ticket.orderItem.orderId,
        sessionId,
        scannedUserId: session.user.id,
        gate,
      },
    }),
  ]);

  return NextResponse.json({ valid: true, checkin }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only volunteers+ can view check-in records
  if (!canAccess(session.user.role, "volunteer")) {
    return NextResponse.json({ error: "Insufficient permissions. Volunteer role required." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session");

  const checkins = await prisma.checkin.findMany({
    where: sessionId ? { sessionId } : {},
    orderBy: { checkinTime: "desc" },
    include: {
      order: {
        include: { user: { select: { name: true } } },
      },
    },
  });

  return NextResponse.json(checkins);
}
