// src/app/api/ai/match-volunteers/route.ts
// Matches volunteers to shifts using Groq/Llama.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccess } from "@/lib/roles";
import { generateText } from "@/lib/ai";
import { z } from "zod";

const schema = z.object({
  shiftId: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!canAccess(session.user.role, "admin")) {
    return NextResponse.json({ error: "Insufficient permissions. Admin role required." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const shift = await prisma.shift.findUnique({
    where: { id: parsed.data.shiftId },
    include: {
      volunteerRole: true,
      event: { select: { entityName: true, startTime: true } },
      _count: { select: { assignments: true } },
    },
  });

  if (!shift) return NextResponse.json({ error: "Shift not found" }, { status: 404 });

  const assignedUserIds = await prisma.volunteerAssignment
    .findMany({ where: { shiftId: shift.id }, select: { userId: true } })
    .then((a) => a.map((x) => x.userId));

  const volunteers = await prisma.volunteerProfile.findMany({
    where: {
      backgroundCheckStatus: "approved",
      userId: { notIn: assignedUserIds },
    },
    include: { user: { select: { id: true, name: true, email: true } } },
    take: 30,
  });

  if (volunteers.length === 0) {
    return NextResponse.json({ matches: [], reason: "No available approved volunteers" });
  }

  const prompt = `You are a volunteer coordinator AI. Match the best volunteers to this shift.

SHIFT DETAILS:
- Role: ${shift.volunteerRole.name}
- Description: ${shift.volunteerRole.description ?? "N/A"}
- Event: ${shift.event.entityName}
- Date: ${new Date(shift.event.startTime).toDateString()}
- Spots needed: ${shift.requiredCount - shift._count.assignments}
- Location: ${shift.location ?? "TBD"}

AVAILABLE VOLUNTEERS:
${volunteers.map((v, i) => `${i + 1}. ${v.user.name} | Skills: ${v.skills ?? "Not specified"} | Availability: ${v.availabilityNotes ?? "Not specified"}`).join("\n")}

Respond ONLY with valid JSON. No markdown, no code fences, just the raw JSON object.
{
  "topMatches": [
    { "name": "volunteer name", "email": "their email", "reason": "1 sentence why", "score": 1-10 }
  ],
  "reasoning": "1-2 sentence summary"
}

Return the top 3–5 best matches, ordered by score descending.`;

  try {
    const rawText = await generateText(prompt);

    if (rawText === null) {
      return NextResponse.json({
        topMatches: [],
        reasoning: "AI matching is not configured. Add a GROQ_API_KEY to .env.local.",
        demo: true,
      });
    }

    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleaned);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[ai/match-volunteers] Groq API error:", err);
    return NextResponse.json({ error: "Failed to process AI response" }, { status: 500 });
  }
}
