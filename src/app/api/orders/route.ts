// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/roles";
import { z } from "zod";

const orderItemSchema = z.object({
  ticketTypeId: z.string(),
  qty:          z.number().int().min(1),
});

const createOrderSchema = z.object({
  eventId: z.string(),
  name:    z.string().min(2),
  items:   z.array(orderItemSchema).min(1),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("event");

  // Admins+ see all orders; attendees/volunteers see only their own
  const whereClause = canAccess(session.user.role, "organizer")
    ? (eventId ? { eventId } : {})
    : { userId: session.user.id!, ...(eventId ? { eventId } : {}) };

  const orders = await prisma.order.findMany({
    where: whereClause,
    orderBy: { orderTime: "desc" },
    include: {
      user:  { select: { name: true, email: true } },
      event: { select: { entityName: true } },
      items: { include: { ticketType: { select: { name: true, price: true } } } },
      payment: true,
    },
  });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Any authenticated user (attendee+) can create an order
  const body = await req.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { eventId, name, items } = parsed.data;

  // Fetch ticket type prices to calculate total
  const ticketTypes = await prisma.ticketType.findMany({
    where: { id: { in: items.map((i) => i.ticketTypeId) } },
  });
  const priceMap = Object.fromEntries(ticketTypes.map((t) => [t.id, Number(t.price)]));

  const totalAmount = items.reduce((sum, item) => {
    return sum + (priceMap[item.ticketTypeId] ?? 0) * item.qty;
  }, 0);

  // Create order + items in a transaction
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId: session.user.id!,
        eventId,
        name,
        status: "confirmed",
        totalAmount,
        items: {
          create: items.map((item) => ({
            ticketTypeId: item.ticketTypeId,
            qty: item.qty,
            unitPrice: priceMap[item.ticketTypeId] ?? 0,
          })),
        },
      },
      include: { items: true },
    });

    // Generate tickets for each order item
    for (const item of newOrder.items) {
      const ticketData = Array.from({ length: item.qty }, () => ({
        orderItemId:    item.id,
        attendeeUserId: session.user.id!,
        status:         "active",
      }));
      await tx.ticket.createMany({ data: ticketData });
    }

    return newOrder;
  });

  return NextResponse.json(order, { status: 201 });
}
