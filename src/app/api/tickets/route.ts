// src/app/api/tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/roles";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user");

  // Organizers+ can view all tickets; attendees/volunteers see only their own
  const whereClause = canAccess(session.user.role, "organizer")
    ? (userId ? { attendeeUserId: userId } : {})
    : { attendeeUserId: session.user.id! };

  const tickets = await prisma.ticket.findMany({
    where: whereClause,
    orderBy: { issuedAt: "desc" },
    include: {
      attendeeUser: { select: { name: true, email: true } },
      orderItem: {
        include: {
          ticketType: { select: { name: true, price: true } },
          order: {
            include: { event: { select: { entityName: true, startTime: true, venue: true } } },
          },
        },
      },
    },
  });

  return NextResponse.json(tickets);
}
