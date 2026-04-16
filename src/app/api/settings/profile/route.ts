// src/app/api/settings/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone:    z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(async () => {
    // Also handle form data
    const form = await req.formData();
    return Object.fromEntries(form.entries());
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data:  parsed.data,
    select: { name: true, email: true, phone: true },
  });

  return NextResponse.json(user);
}
