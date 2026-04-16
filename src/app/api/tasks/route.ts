// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/roles";
import { z } from "zod";

const createTaskSchema = z.object({
  assigneeId:  z.string(),
  eventId:     z.string().optional(),
  title:       z.string().min(2).max(200),
  description: z.string().optional(),
  priority:    z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueTime:     z.string().datetime().optional(),
  status:      z.enum(["open", "in_progress", "completed", "cancelled"]).default("open"),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Organizers+ see all tasks; volunteers see only their assigned tasks
  const whereClause = canAccess(session.user.role, "organizer")
    ? {}
    : { assigneeId: session.user.id! };

  const tasks = await prisma.task.findMany({
    where: whereClause,
    orderBy: [{ priority: "desc" }, { dueTime: "asc" }],
    include: {
      assignee:  { select: { name: true } },
      createdBy: { select: { name: true } },
      event:     { select: { entityName: true } },
    },
  });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only organizers+ can create tasks
  if (!canAccess(session.user.role, "organizer")) {
    return NextResponse.json({ error: "Insufficient permissions. Organizer role required." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: { ...parsed.data, createdById: session.user.id! },
    include: { assignee: { select: { name: true } } },
  });

  // Notify the assignee
  if (parsed.data.assigneeId !== session.user.id) {
    await prisma.notification.create({
      data: {
        userId:  parsed.data.assigneeId,
        eventId: parsed.data.eventId,
        title:   "New Task Assigned",
        body:    `You have been assigned a new task: "${task.title}"`,
        channel: "in_app",
      },
    });
  }

  return NextResponse.json(task, { status: 201 });
}
