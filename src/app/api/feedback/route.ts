// src/app/api/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/roles";
import { z } from "zod";

const feedbackSchema = z.object({
  eventId:  z.string(),
  rating:   z.number().int().min(1).max(5),
  comments: z.string().optional(),
});

// GET feedback for an event (or all if admin)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("event");

  const where = canAccess(session.user.role, "organizer")
    ? (eventId ? { eventId } : {})
    : { userId: session.user.id!, ...(eventId ? { eventId } : {}) };

  const feedback = await prisma.feedback.findMany({
    where,
    orderBy: { submittedAt: "desc" },
    include: {
      user: { select: { name: true, image: true } },
      event: { select: { entityName: true } },
    },
  });

  return NextResponse.json(feedback);
}

// POST submit feedback
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  // Check if user already reviewed this event
  const existing = await prisma.feedback.findFirst({
    where: { userId: session.user.id!, eventId: parsed.data.eventId },
  });
  if (existing) {
    // Update existing review
    const updated = await prisma.feedback.update({
      where: { id: existing.id },
      data: { rating: parsed.data.rating, comments: parsed.data.comments },
    });
    return NextResponse.json(updated);
  }

  const feedback = await prisma.feedback.create({
    data: {
      userId: session.user.id!,
      eventId: parsed.data.eventId,
      rating: parsed.data.rating,
      comments: parsed.data.comments,
    },
  });

  return NextResponse.json(feedback, { status: 201 });
}
