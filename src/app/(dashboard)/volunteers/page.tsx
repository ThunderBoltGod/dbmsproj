// src/app/(dashboard)/volunteers/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/roles";
import { Users, CheckCircle, Clock, XCircle, Shield } from "lucide-react";
import { redirect } from "next/navigation";

export const metadata = { title: "Volunteers" };

export default async function VolunteersPage() {
  const session = await auth();
  const role = session!.user.role || "attendee";

  // Only admins+ can view volunteer management
  if (!canAccess(role, "admin")) {
    redirect("/dashboard");
  }

  const applications = await prisma.volunteerApplication.findMany({
    orderBy: { appliedAt: "desc" },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      event: { select: { entityName: true } },
    },
  });

  const profiles = await prisma.volunteerProfile.count({ where: { backgroundCheckStatus: "approved" } });

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-foreground">Volunteers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage volunteer applications and assignments
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
        {[
          { label: "Total Applications", value: stats.total, color: "text-blue-600 dark:text-blue-400", icon: Users },
          { label: "Pending Review", value: stats.pending, color: "text-amber-600 dark:text-amber-400", icon: Clock },
          { label: "Approved", value: stats.approved, color: "text-emerald-600 dark:text-emerald-400", icon: CheckCircle },
          { label: "Rejected", value: stats.rejected, color: "text-red-600 dark:text-red-400", icon: XCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card">
            <Icon size={18} className={`mb-3 ${color}`} />
            <div className="stat-value">{value}</div>
            <p className="text-sm mt-1 text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Applications table */}
      <div className="card animate-fade-up">
        <h2 className="font-semibold mb-5 text-foreground">Applications</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Volunteer", "Event", "Applied", "Status", "Actions"].map((h) => (
                  <th key={h} className="pb-3 text-left text-xs font-medium pr-4 text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No applications yet</td></tr>
              ) : applications.map((app) => (
                <tr key={app.id} className="table-row">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-foreground">{app.user.name}</p>
                    <p className="text-xs text-muted-foreground">{app.user.email}</p>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{app.event.entityName}</td>
                  <td className="py-3 pr-4 text-xs text-muted-foreground">
                    {new Date(app.appliedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`badge badge-${app.status}`}>{app.status}</span>
                  </td>
                  <td className="py-3">
                    {app.status === "pending" && (
                      <div className="flex gap-2">
                        <ApproveButton id={app.id} action="approved" />
                        <ApproveButton id={app.id} action="rejected" />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Client component for approve/reject actions
function ApproveButton({ id, action }: { id: string; action: string }) {
  const isApprove = action === "approved";
  return (
    <form action={`/api/volunteers/${id}/status`} method="POST">
      <input type="hidden" name="status" value={action} />
      <button type="submit"
        className={isApprove
          ? "btn-outline text-xs py-1 px-2.5 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
          : "btn-outline text-xs py-1 px-2.5 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10"}>
        {isApprove ? "Approve" : "Reject"}
      </button>
    </form>
  );
}
