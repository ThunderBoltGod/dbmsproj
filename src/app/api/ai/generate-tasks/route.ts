// src/app/api/ai/generate-tasks/route.ts
// Generates a task checklist for an event using Groq/Llama.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { generateText } from "@/lib/ai";
import { z } from "zod";

const schema = z.object({
  eventId: z.string(),
  saveTasks: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });



  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { eventId, saveTasks } = parsed.data;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      venue: { select: { name: true, city: true, capacity: true } },
      sessions: { select: { title: true, startTime: true } },
      ticketTypes: { select: { name: true } },
      _count: { select: { volunteerApplications: true } },
    },
  });

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const prompt = `You are a professional event coordinator. Generate a comprehensive task checklist for this event.

Event: ${event.entityName}
Date: ${new Date(event.startTime).toDateString()}
Venue: ${event.venue ? `${event.venue.name}, ${event.venue.city} (capacity: ${event.venue.capacity ?? "unknown"})` : "TBD"}
Sessions: ${event.sessions.map((s) => s.title).join(", ") || "None set"}
Ticket types: ${event.ticketTypes.map((t) => t.name).join(", ") || "None set"}
Volunteer applications: ${event._count.volunteerApplications}

Generate 10–15 realistic tasks that need to be done to run this event successfully.
Cover: pre-event logistics, volunteer coordination, marketing, day-of operations, and post-event follow-up.

Respond ONLY with a valid JSON array. No markdown, no explanation, no code fences, just the raw JSON array.
Each task object must have exactly these fields:
{
  "title": "short action-oriented task title",
  "description": "1-2 sentence detail about what needs to be done",
  "priority": "low" | "medium" | "high" | "urgent",
  "category": "logistics" | "marketing" | "volunteers" | "operations" | "post-event",
  "daysBeforeEvent": number (positive = days before, 0 = day of, negative = days after)
}`;

  try {
    const rawText = await generateText(prompt);

    if (rawText === null) {
      return NextResponse.json({
        tasks: [
          { title: "Book venue and confirm logistics", description: "Confirm all venue details and catering.", priority: "high", category: "logistics", daysBeforeEvent: 30 },
          { title: "Send invitations", description: "Email all attendees with event details.", priority: "high", category: "marketing", daysBeforeEvent: 14 },
          { title: "Brief volunteer team", description: "Hold orientation for all volunteers.", priority: "medium", category: "volunteers", daysBeforeEvent: 3 },
        ],
        demo: true,
      });
    }

    let tasks: Array<{ title: string; description: string; priority: string; category: string; daysBeforeEvent: number }>;
    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      tasks = JSON.parse(cleaned);
    } catch {
      console.error("[ai/generate-tasks] Failed to parse AI response:", rawText);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    if (saveTasks && tasks.length > 0) {
      const eventDate = new Date(event.startTime);
      await prisma.task.createMany({
        data: tasks.map((t) => {
          const dueDate = new Date(eventDate);
          dueDate.setDate(dueDate.getDate() - t.daysBeforeEvent);
          return {
            assigneeId: session.user.id!,
            createdById: session.user.id!,
            eventId,
            title: t.title,
            description: t.description,
            priority: t.priority as "low" | "medium" | "high" | "urgent",
            status: "open",
            dueTime: dueDate,
          };
        }),
      });
    }

    return NextResponse.json({ tasks });
  } catch (err) {
    console.error("[ai/generate-tasks] Groq API error:", err);
    return NextResponse.json({ error: "AI request failed. Please try again." }, { status: 500 });
  }
}
