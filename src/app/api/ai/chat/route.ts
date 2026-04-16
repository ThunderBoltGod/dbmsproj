// src/app/api/ai/chat/route.ts
// Role-aware AI chat assistant using Groq/Llama.
// Each role gets a data snapshot relevant to them.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccess } from "@/lib/roles";
import { chatCompletion } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages } = await req.json();
  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "messages array required" }, { status: 400 });
  }

  const role = session.user.role || "attendee";
  const userId = session.user.id!;
  const isOrganizer = canAccess(role, "organizer");
  const isVolunteer = canAccess(role, "volunteer");

  // ── Build role-appropriate data snapshot ─────────────────────────────────
  let dataSnapshot: string;
  let roleGuidelines: string;

  if (isOrganizer) {
    // Full platform data for organizers/admins
    const [events, orders, volunteers, tasks, tickets] = await Promise.all([
      prisma.event.findMany({
        take: 20, orderBy: { startTime: "asc" },
        include: {
          venue: { select: { name: true, city: true } },
          org: { select: { name: true } },
          ticketTypes: { select: { name: true, price: true } },
          _count: { select: { orders: true, volunteerApplications: true, feedback: true } },
        },
      }),
      prisma.order.findMany({
        take: 30, orderBy: { orderTime: "desc" },
        include: {
          user: { select: { name: true } },
          event: { select: { entityName: true } },
        },
      }),
      prisma.volunteerApplication.findMany({
        take: 20,
        include: { user: { select: { name: true } }, event: { select: { entityName: true } } },
      }),
      prisma.task.findMany({
        take: 20, where: { status: { not: "completed" } },
        orderBy: [{ priority: "desc" }, { dueTime: "asc" }],
        include: { assignee: { select: { name: true } }, event: { select: { entityName: true } } },
      }),
      prisma.ticket.groupBy({ by: ["status"], _count: { id: true } }),
    ]);

    const totalRevenue = orders.filter((o) => o.status === "confirmed").reduce((s, o) => s + Number(o.totalAmount), 0);

    dataSnapshot = JSON.stringify({
      summary: { totalEvents: events.length, totalOrders: orders.length, confirmedRevenue: `$${totalRevenue.toFixed(2)}`, openTasks: tasks.length },
      events: events.map((e) => ({ name: e.entityName, status: e.status, date: e.startTime, venue: e.venue ? `${e.venue.name}, ${e.venue.city}` : null, orders: e._count.orders, volunteers: e._count.volunteerApplications })),
      recentOrders: orders.slice(0, 10).map((o) => ({ customer: o.user.name, event: o.event.entityName, amount: `$${Number(o.totalAmount).toFixed(2)}`, status: o.status })),
      openTasks: tasks.map((t) => ({ title: t.title, priority: t.priority, assignee: t.assignee.name, event: t.event?.entityName })),
    }, null, 2);

    roleGuidelines = `You have access to FULL platform data including revenue, orders, volunteers, and tasks.
You can help with analytics, event planning, volunteer management, and business decisions.`;

  } else if (isVolunteer) {
    // Volunteer sees their tasks, applications, and upcoming events
    const [myTasks, myApps, upcomingEvents] = await Promise.all([
      prisma.task.findMany({
        where: { assigneeId: userId, status: { not: "completed" } },
        orderBy: [{ priority: "desc" }, { dueTime: "asc" }],
        include: { event: { select: { entityName: true } } },
        take: 10,
      }),
      prisma.volunteerApplication.findMany({
        where: { userId },
        include: { event: { select: { entityName: true, startTime: true } } },
      }),
      prisma.event.findMany({
        where: { startTime: { gte: new Date() }, status: "published" },
        select: { entityName: true, startTime: true },
        take: 8, orderBy: { startTime: "asc" },
      }),
    ]);

    dataSnapshot = JSON.stringify({
      myTasks: myTasks.map((t) => ({ title: t.title, priority: t.priority, status: t.status, due: t.dueTime, event: t.event?.entityName })),
      myVolunteerApplications: myApps.map((a) => ({ event: a.event.entityName, status: a.status, eventDate: a.event.startTime })),
      upcomingEvents: upcomingEvents.map((e) => ({ name: e.entityName, date: e.startTime })),
    }, null, 2);

    roleGuidelines = `You can see this volunteer's tasks, applications, and upcoming events.
Help them manage their schedule, understand their tasks, and find events to volunteer at.
Do NOT share revenue, financial data, or other users' personal info.`;

  } else {
    // Attendee sees their tickets, orders, and upcoming events
    const [myTickets, myOrders, upcomingEvents, platformFeedback] = await Promise.all([
      prisma.ticket.findMany({
        where: { attendeeUserId: userId },
        include: { orderItem: { include: { order: { include: { event: { select: { entityName: true, startTime: true } } } } } } },
        take: 10,
      }),
      prisma.order.findMany({
        where: { userId },
        include: { event: { select: { entityName: true } } },
        take: 10, orderBy: { orderTime: "desc" },
      }),
      prisma.event.findMany({
        where: { startTime: { gte: new Date() }, status: "published" },
        select: { entityName: true, startTime: true },
        take: 8, orderBy: { startTime: "asc" },
      }),
      prisma.feedback.aggregate({ _avg: { rating: true }, _count: { id: true } }),
    ]);

    dataSnapshot = JSON.stringify({
      myTickets: myTickets.map((t) => ({ event: t.orderItem.order.event.entityName, status: t.status, eventDate: t.orderItem.order.event.startTime })),
      myOrders: myOrders.map((o) => ({ event: o.event.entityName, amount: `$${Number(o.totalAmount).toFixed(2)}`, status: o.status })),
      upcomingEvents: upcomingEvents.map((e) => ({ name: e.entityName, date: e.startTime })),
      platformRating: { avg: platformFeedback._avg.rating?.toFixed(1) ?? "none", reviews: platformFeedback._count.id },
    }, null, 2);

    roleGuidelines = `You can see this attendee's tickets, orders, and upcoming events.
Help them find events, check ticket status, and answer questions about attending.
Do NOT share revenue, financial data, admin info, or other users' data.`;
  }

  const systemInstruction = `You are EventHub AI — a helpful assistant embedded in an event management platform.

Current user: ${session.user.name} (${session.user.email}), Role: ${role}
Current time: ${new Date().toISOString()}

${roleGuidelines}

=== USER'S DATA ===
${dataSnapshot}
===================

Guidelines:
- Be concise and practical. Bullet points work well.
- Reference specific event names, numbers from the data.
- If asked to do something, explain how to do it in the UI.
- Format money as $X.XX. Format dates readably.
- Keep responses focused.`;

  try {
    const reply = await chatCompletion(messages, systemInstruction);

    if (reply === null) {
      return NextResponse.json({
        reply: "AI Assistant is not configured. Add a GROQ_API_KEY to your .env.local to enable it.",
      });
    }

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    console.error("[ai/chat] Groq API error:", err);
    return NextResponse.json({
      reply: "Something went wrong with the AI service. Please try again.",
    });
  }
}
