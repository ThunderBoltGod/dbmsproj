// src/app/(dashboard)/tasks/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/roles";
import { ClipboardList, Plus } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Tasks" };

export default async function TasksPage() {
  const session = await auth();
  const role = session!.user.role || "attendee";
  const isOrganizer = canAccess(role, "organizer");

  // Volunteers see only their own tasks; organizers+ see all
  const tasks = await prisma.task.findMany({
    where: isOrganizer ? {} : { assigneeId: session!.user.id! },
    orderBy: [{ priority: "desc" }, { dueTime: "asc" }],
    include: {
      assignee:  { select: { name: true } },
      createdBy: { select: { name: true } },
      event:     { select: { entityName: true } },
    },
  });

  const grouped = {
    open:        tasks.filter((t) => t.status === "open"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    completed:   tasks.filter((t) => t.status === "completed"),
    cancelled:   tasks.filter((t) => t.status === "cancelled"),
  };

  const COLUMNS = [
    { key: "open",        label: "Open",        color: "bg-gray-500" },
    { key: "in_progress", label: "In Progress", color: "bg-amber-500" },
    { key: "completed",   label: "Completed",   color: "bg-emerald-500" },
    { key: "cancelled",   label: "Cancelled",   color: "bg-red-500" },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isOrganizer ? "Tasks" : "My Tasks"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tasks.length} total · {grouped.open.length} open
          </p>
        </div>
        {isOrganizer && (
          <Link href="/tasks/new" className="btn-primary">
            <Plus size={16} /> New Task
          </Link>
        )}
      </div>

      {/* Kanban-style columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map(({ key, label, color }) => {
          const col = grouped[key];
          return (
            <div key={key} className="space-y-3">
              {/* Column header */}
              <div className="flex items-center gap-2 px-1">
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-sm font-semibold text-foreground">{label}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent text-muted-foreground">
                  {col.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2.5">
                {col.map((task) => (
                  <div key={task.id} className="card cursor-pointer" style={{ padding: "1rem" }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium leading-snug text-foreground">
                        {task.title}
                      </p>
                      <span className={`badge badge-${task.priority} shrink-0`}>{task.priority}</span>
                    </div>

                    {task.description && (
                      <p className="text-xs mb-3 line-clamp-2 text-muted-foreground">
                        {task.description}
                      </p>
                    )}

                    {task.event && (
                      <p className="text-xs mb-2 truncate text-primary/80">
                        📅 {task.event.entityName}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-primary/10 text-primary">
                          {task.assignee.name[0]}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {task.assignee.name.split(" ")[0]}
                        </span>
                      </div>
                      {task.dueTime && (
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(task.dueTime).toLocaleDateString("en", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {col.length === 0 && (
                  <div className="rounded-lg border-2 border-dashed border-border py-8 text-center">
                    <p className="text-xs text-muted-foreground/50">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
