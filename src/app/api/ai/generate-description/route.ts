// src/app/api/ai/generate-description/route.ts
// Generates an event description using Groq/Llama.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

import { generateText } from "@/lib/ai";
import { z } from "zod";

const schema = z.object({
  eventName: z.string().min(2),
  eventType: z.string().optional(),
  date: z.string().optional(),
  venue: z.string().optional(),
  highlights: z.string().optional(),
  tone: z.enum(["professional", "casual", "exciting", "formal"]).default("professional"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });



  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { eventName, eventType, date, venue, highlights, tone } = parsed.data;

  const prompt = `Write a compelling event description for the following event.

Event name: ${eventName}
${eventType ? `Type: ${eventType}` : ""}
${date ? `Date: ${date}` : ""}
${venue ? `Venue: ${venue}` : ""}
${highlights ? `Key highlights: ${highlights}` : ""}
Tone: ${tone}

Requirements:
- 2–3 paragraphs, around 100–150 words total
- Engaging opening sentence
- Highlight what attendees will get out of it
- End with a call to action (e.g. "Get your tickets now")
- Plain text only, no markdown or bullet points

Write only the description, no preamble.`;

  try {
    const description = await generateText(prompt);

    if (description === null) {
      return NextResponse.json({
        description: `Join us for ${eventName}! This is a sample description. Add a GROQ_API_KEY to .env.local to enable AI-generated descriptions.`,
      });
    }

    return NextResponse.json({ description });
  } catch (err) {
    console.error("[ai/generate-description] Groq API error:", err);
    return NextResponse.json({ error: "AI request failed. Please try again." }, { status: 500 });
  }
}
