// src/app/api/ai/insights/route.ts
// Generates role-aware insights using Groq/Llama.
// Attendees see event recommendations & ratings.
// Volunteers see task updates & shift info.
// Organizers+ see revenue, orders, and full analytics.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccess } from "@/lib/roles";
import { generateText } from "@/lib/ai";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role || "attendee";
  const userId = session.user.id!;
  const isOrganizer = canAccess(role, "organizer");
  const isVolunteer = canAccess(role, "volunteer");

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("event");

  let statsText: string;
  let promptContext: string;

  if (isOrganizer) {
    // ── ORGANIZER+ VIEW: full analytics ──────────────────────────────────
    const where = eventId ? { eventId } : {};

    const [orders, tickets, volunteers, feedback, tasks] = await Promise.all([
      prisma.order.findMany({ where, select: { status: true, totalAmount: true } }),
      prisma.ticket.findMany({
        where: eventId ? { orderItem: { order: { eventId } } } : {},
        select: { status: true },
      }),
      prisma.volunteerApplication.findMany({ where, select: { status: true } }),
      prisma.feedback.findMany({ where, select: { rating: true } }),
      prisma.task.findMany({
        where: eventId ? { eventId } : {},
        select: { status: true, priority: true },
      }),
    ]);

    const revenue = orders.filter((o) => o.status === "confirmed").reduce((s, o) => s + Number(o.totalAmount), 0);
    const avgRating = feedback.length
      ? (feedback.reduce((s, f) => s + (f.rating ?? 0), 0) / feedback.length).toFixed(1)
      : null;

    statsText = JSON.stringify({
      orders: { total: orders.length, confirmed: orders.filter((o) => o.status === "confirmed").length, pending: orders.filter((o) => o.status === "pending").length, revenue: `$${revenue.toFixed(2)}` },
      tickets: { total: tickets.length, active: tickets.filter((t) => t.status === "active").length, used: tickets.filter((t) => t.status === "used").length },
      volunteers: { total: volunteers.length, approved: volunteers.filter((v) => v.status === "approved").length, pending: volunteers.filter((v) => v.status === "pending").length },
      feedback: { responses: feedback.length, avgRating: avgRating ?? "none yet" },
      tasks: { open: tasks.filter((t) => t.status === "open").length, urgent: tasks.filter((t) => t.priority === "urgent").length },
    }, null, 2);

    promptContext = `You are an expert event analyst. Write insights for an event organizer/admin.
Cover: revenue health, ticket sales, volunteer pipeline, feedback, and any red flags.`;

  } else if (isVolunteer) {
    // ── VOLUNTEER VIEW: tasks, shifts, events ────────────────────────────
    const [myTasks, upcomingEvents, myApplications] = await Promise.all([
      prisma.task.findMany({
        where: { assigneeId: userId, status: { not: "completed" } },
        select: { title: true, priority: true, status: true, dueTime: true },
        take: 10,
      }),
      prisma.event.findMany({
        where: { startTime: { gte: new Date() } },
        select: { entityName: true, startTime: true, status: true },
        take: 5,
        orderBy: { startTime: "asc" },
      }),
      prisma.volunteerApplication.findMany({
        where: { userId },
        select: { status: true, event: { select: { entityName: true } } },
      }),
    ]);

    statsText = JSON.stringify({
      myTasks: { total: myTasks.length, urgent: myTasks.filter((t) => t.priority === "urgent").length, tasks: myTasks },
      upcomingEvents: upcomingEvents.map((e) => ({ name: e.entityName, date: e.startTime, status: e.status })),
      myApplications: { total: myApplications.length, approved: myApplications.filter((a) => a.status === "approved").length, pending: myApplications.filter((a) => a.status === "pending").length },
    }, null, 2);

    promptContext = `You are a helpful assistant for a volunteer on an event platform. Write friendly, actionable insights.
Cover: their upcoming tasks and deadlines, volunteer application status, and upcoming events they might help with.
Do NOT mention revenue, profits, or financial data.`;

  } else {
    // ── ATTENDEE VIEW: events, tickets, ratings ──────────────────────────
    const [myTickets, upcomingEvents, myOrders, platformFeedback] = await Promise.all([
      prisma.ticket.findMany({
        where: { attendeeUserId: userId },
        select: { status: true, orderItem: { select: { order: { select: { event: { select: { entityName: true } } } } } } },
      }),
      prisma.event.findMany({
        where: { startTime: { gte: new Date() }, status: "published" },
        select: { entityName: true, startTime: true },
        take: 5,
        orderBy: { startTime: "asc" },
      }),
      prisma.order.count({ where: { userId } }),
      prisma.feedback.aggregate({ _avg: { rating: true }, _count: { id: true } }),
    ]);

    statsText = JSON.stringify({
      myTickets: { total: myTickets.length, active: myTickets.filter((t) => t.status === "active").length, used: myTickets.filter((t) => t.status === "used").length },
      upcomingEvents: upcomingEvents.map((e) => ({ name: e.entityName, date: e.startTime })),
      totalOrders: myOrders,
      platformRating: { avg: platformFeedback._avg.rating?.toFixed(1) ?? "none", totalReviews: platformFeedback._count.id },
    }, null, 2);

    promptContext = `You are a friendly assistant for an event attendee. Write helpful, engaging insights.
Cover: their tickets, upcoming events they can attend, platform ratings/reviews, and suggestions.
Do NOT mention revenue, profits, volunteer management, or admin-level data.`;
  }

  let eventLabel = "the platform";
  if (eventId) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { entityName: true },
    });
    eventLabel = event ? `"${event.entityName}"` : "this event";
  }

  const prompt = `${promptContext}

Here is the data for ${eventLabel}:
${statsText}

Write 3–5 bullet points. Keep each to 1–2 sentences. Be specific with numbers. Start each bullet with a relevant emoji.
Write only the bullet points, nothing else.`;

  try {
    const insights = await generateText(prompt);

    if (insights === null) {
      return NextResponse.json({
        insights: "🎉 Welcome to EventHub! AI insights will appear here once configured.",
        generatedAt: new Date().toISOString(),
        demo: true,
      });
    }

    return NextResponse.json({ insights, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[ai/insights] Groq API error:", err);
    return NextResponse.json({
      insights: "⚠️ AI insights are temporarily unavailable. Please try again later.",
      generatedAt: new Date().toISOString(),
    });
  }
}
