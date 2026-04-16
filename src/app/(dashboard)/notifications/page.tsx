// src/app/(dashboard)/notifications/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Bell, BellOff } from "lucide-react";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await auth();

  const notifications = await prisma.notification.findMany({
    where: { userId: session!.user.id },
    orderBy: { sentAt: "desc" },
    include: { event: { select: { entityName: true } } },
  });

  const unread = notifications.filter((n) => !n.read).length;

  const CHANNEL_COLORS: Record<string, string> = {
    in_app: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10",
    email:  "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
    sms:    "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unread} unread · {notifications.length} total
          </p>
        </div>
        {unread > 0 && (
          <form action="/api/notifications/read-all" method="POST">
            <button type="submit" className="btn-outline text-sm">Mark all read</button>
          </form>
        )}
      </div>

      <div className="space-y-2 animate-fade-up">
        {notifications.length === 0 ? (
          <div className="card text-center py-16">
            <BellOff size={36} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-medium text-foreground">No notifications</p>
            <p className="text-sm mt-1 text-muted-foreground">You&apos;re all caught up!</p>
          </div>
        ) : notifications.map((n) => (
          <div key={n.id} className={`card flex items-start gap-4 ${n.read ? 'opacity-60' : ''}`}
            style={{ padding: "1rem 1.25rem" }}>
            {/* Unread dot */}
            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-transparent' : 'bg-primary'}`} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-foreground">{n.title}</p>
                <span className={`badge text-[10px] ${CHANNEL_COLORS[n.channel] || ''}`}>
                  {n.channel.replace("_", " ")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{n.body}</p>
              {n.event && (
                <p className="text-xs mt-1 text-primary/70">
                  📅 {n.event.entityName}
                </p>
              )}
            </div>

            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">
                {new Date(n.sentAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
              </p>
              <p className="text-xs mt-0.5 text-muted-foreground/60">
                {new Date(n.sentAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
