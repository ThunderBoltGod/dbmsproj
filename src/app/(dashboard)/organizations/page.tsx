// src/app/(dashboard)/organizations/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/roles";
import { Building2, Plus, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Organizations" };

export default async function OrganizationsPage() {
  const session = await auth();
  if (!canAccess(session!.user.role, "admin")) redirect("/dashboard");

  const orgs = await prisma.organization.findMany({
    include: {
      _count: { select: { members: true, events: true } },
      members: {
        where: { userId: session!.user.id },
        select: { memberRole: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organizations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {orgs.length} organization{orgs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/organizations/new" className="btn-primary">
          <Plus size={16} /> New Org
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
        {orgs.map((org) => {
          const myRole = org.members[0]?.memberRole;
          return (
            <div key={org.id} className="card">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 bg-primary/10 text-primary">
                  {org.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate text-foreground">{org.name}</h3>
                  <p className="text-xs truncate text-muted-foreground">{org.email}</p>
                </div>
                {myRole && (
                  <span className="badge badge-active text-[10px]">{myRole}</span>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Users size={13} />
                  {org._count.members} member{org._count.members !== 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-1.5">
                  <Building2 size={13} />
                  {org._count.events} event{org._count.events !== 1 ? "s" : ""}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                <span className={`badge badge-${org.status}`}>{org.status}</span>
                <span className="text-xs text-muted-foreground">
                  Since {new Date(org.createdAt).getFullYear()}
                </span>
              </div>
            </div>
          );
        })}

        {orgs.length === 0 && (
          <div className="col-span-full card text-center py-16">
            <Building2 size={40} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-medium text-foreground">No organizations yet</p>
            <p className="text-sm mt-1 mb-4 text-muted-foreground">Create one to start managing events</p>
            <Link href="/organizations/new" className="btn-primary inline-flex">
              <Plus size={16} /> Create Organization
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
