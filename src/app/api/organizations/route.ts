// src/app/api/organizations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/roles";
import { z } from "zod";

const createOrgSchema = z.object({
  name:  z.string().min(2).max(200),
  email: z.string().email(),
  phone: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgs = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { members: true, events: true } },
    },
  });
  return NextResponse.json(orgs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!canAccess(session.user.role, "admin")) {
    return NextResponse.json({ error: "Admin role required to create organizations" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createOrgSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const org = await prisma.organization.create({
    data: {
      ...parsed.data,
      members: {
        create: {
          userId: session.user.id!,
          memberRole: "owner",
        },
      },
    },
  });

  await prisma.assistLog.create({
    data: {
      userId: session.user.id!,
      orgId: org.id,
      entityName: "Organization",
      action: "created",
      metadata: JSON.stringify({ orgName: org.name }),
    },
  });

  return NextResponse.json(org, { status: 201 });
}
