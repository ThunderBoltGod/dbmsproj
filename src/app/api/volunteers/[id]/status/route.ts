// src/app/api/volunteers/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/roles";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["approved", "rejected", "withdrawn"]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only admins+ can approve/reject volunteer applications
  if (!canAccess(session.user.role, "admin")) {
    return NextResponse.json({ error: "Insufficient permissions. Admin role required." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const application = await prisma.volunteerApplication.update({
    where: { id },
    data:  { status: parsed.data.status },
    include: { user: { select: { name: true } }, event: { select: { entityName: true } } },
  });

  // Notify the volunteer
  await prisma.notification.create({
    data: {
      userId:  application.userId,
      eventId: application.eventId,
      title:   `Volunteer Application ${parsed.data.status === "approved" ? "Approved! 🎉" : "Update"}`,
      body:    parsed.data.status === "approved"
        ? `Your application for ${application.event.entityName} has been approved. Welcome to the team!`
        : `Your volunteer application for ${application.event.entityName} was ${parsed.data.status}.`,
      channel: "in_app",
    },
  });

  return NextResponse.json(application);
}

// Support POST from form submissions (browsers can only do GET/POST from forms)
export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  return PATCH(req, props);
}
