// src/app/(dashboard)/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Calendar, Ticket, Users, ShoppingCart, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import AIInsights from "@/components/AIInsights";
import { canAccess } from "@/lib/roles";

export const metadata = { title: "Dashboard" };

async function getStats(userId: string, role: string) {
  const isOrganizer = canAccess(role, "organizer");
  const isVolunteer = canAccess(role, "volunteer");

  const [totalEvents, totalTickets, totalOrders, totalVolunteers,
         recentEvents, recentOrders, upcomingTasks] = await Promise.all([
    prisma.event.count({ where: { startTime: { gte: new Date() } } }),
    // Attendees only see their own ticket count
    isOrganizer
      ? prisma.ticket.count()
      : prisma.ticket.count({ where: { attendeeUserId: userId } }),
    // Attendees only see their own order count
    isOrganizer
      ? prisma.order.count()
      : prisma.order.count({ where: { userId } }),
    isOrganizer
      ? prisma.volunteerApplication.count({ where: { status: "approved" } })
      : Promise.resolve(0),
    prisma.event.findMany({
      take: 5,
      orderBy: { startTime: "asc" },
      where: { startTime: { gte: new Date() } },
      include: { venue: true, _count: { select: { orders: true } } },
    }),
    // Attendees only see their own orders
    isOrganizer
      ? prisma.order.findMany({
          take: 5,
          orderBy: { orderTime: "desc" },
          include: { user: { select: { name: true } }, event: { select: { entityName: true } } },
        })
      : prisma.order.findMany({
          take: 5,
          where: { userId },
          orderBy: { orderTime: "desc" },
          include: { user: { select: { name: true } }, event: { select: { entityName: true } } },
        }),
    // Volunteers see their own tasks, organizers+ see all
    isOrganizer
      ? prisma.task.findMany({
          take: 5,
          where: { status: { not: "completed" } },
          orderBy: [{ priority: "desc" }, { dueTime: "asc" }],
          include: { assignee: { select: { name: true } } },
        })
      : isVolunteer
        ? prisma.task.findMany({
            take: 5,
            where: { assigneeId: userId, status: { not: "completed" } },
            orderBy: [{ priority: "desc" }, { dueTime: "asc" }],
            include: { assignee: { select: { name: true } } },
          })
        : Promise.resolve([]),
  ]);

  return { totalEvents, totalTickets, totalOrders, totalVolunteers,
           recentEvents, recentOrders, upcomingTasks };
}

export default async function DashboardPage() {
  const session = await auth();
  const role = session!.user.role || "attendee";
  const stats = await getStats(session!.user.id!, role);
  const isOrganizer = canAccess(role, "organizer");

  // Different stat cards for different roles
  const STATS = isOrganizer
    ? [
        { label: "Total Events",     value: stats.totalEvents,      icon: Calendar,     color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", href: "/events" },
        { label: "Tickets Sold",     value: stats.totalTickets,      icon: Ticket,       color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", href: "/tickets" },
        { label: "Orders",           value: stats.totalOrders,       icon: ShoppingCart,  color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", href: "/orders" },
        { label: "Active Volunteers",value: stats.totalVolunteers,   icon: Users,        color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10", href: "/volunteers" },
      ]
    : [
        { label: "Upcoming Events",  value: stats.totalEvents,      icon: Calendar,     color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", href: "/events" },
        { label: "My Tickets",       value: stats.totalTickets,      icon: Ticket,       color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", href: "/tickets" },
        { label: "My Orders",        value: stats.totalOrders,       icon: ShoppingCart,  color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", href: "/orders" },
      ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-foreground">
          Good {getGreeting()}, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isOrganizer
            ? "Here's what's happening across your events today."
            : "Here's your event activity."}
        </p>
      </div>

      {/* Stats */}
      <div className={`grid grid-cols-2 ${isOrganizer ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 stagger`}>
        {STATS.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href} className="card group cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg}`}>
                <Icon size={18} className={color} />
              </div>
              <TrendingUp size={14} className="text-emerald-500" />
            </div>
            <div className="stat-value">{value.toLocaleString()}</div>
            <p className="mt-1 text-sm text-muted-foreground">{label}</p>
          </Link>
        ))}
      </div>

      {/* AI Insights panel */}
      <AIInsights />

      {/* Grid: upcoming events + recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events — visible to all */}
        <div className="card animate-fade-up" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-foreground">Upcoming Events</h2>
            <Link href="/events" className="text-xs font-medium text-primary">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentEvents.length === 0 ? (
              <p className="text-sm py-6 text-center text-muted-foreground">No upcoming events</p>
            ) : stats.recentEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}
                className="flex items-center gap-3 p-3 rounded-lg transition-colors bg-accent/50 hover:bg-accent">
                <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 bg-primary/10">
                  <span className="text-[10px] font-bold text-primary">
                    {new Date(event.startTime).toLocaleDateString("en", { month: "short" }).toUpperCase()}
                  </span>
                  <span className="text-sm font-bold leading-none text-primary">
                    {new Date(event.startTime).getDate()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">
                    {event.entityName}
                  </p>
                  <p className="text-xs truncate text-muted-foreground">
                    {event.venue?.name ?? "No venue"}
                    {isOrganizer && ` · ${event._count.orders} orders`}
                  </p>
                </div>
                <span className={`badge badge-${event.status}`}>{event.status}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card animate-fade-up" style={{ animationDelay: "180ms" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-foreground">
              {isOrganizer ? "Recent Orders" : "My Orders"}
            </h2>
            <Link href="/orders" className="text-xs font-medium text-primary">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentOrders.length === 0 ? (
              <p className="text-sm py-6 text-center text-muted-foreground">No orders yet</p>
            ) : stats.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  {order.user.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">
                    {order.user.name}
                  </p>
                  <p className="text-xs truncate text-muted-foreground">
                    {order.event.entityName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold mono text-foreground">
                    ${Number(order.totalAmount).toFixed(2)}
                  </p>
                  <span className={`badge badge-${order.status}`}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks — only for volunteer+ */}
      {stats.upcomingTasks.length > 0 && (
        <div className="card animate-fade-up" style={{ animationDelay: "240ms" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-foreground">
              {isOrganizer ? "Open Tasks" : "My Tasks"} <span className="badge badge-pending ml-2">{stats.upcomingTasks.length}</span>
            </h2>
            <Link href="/tasks" className="text-xs font-medium text-primary">View all →</Link>
          </div>
          <div className="space-y-2">
            {stats.upcomingTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                <p className="flex-1 text-sm text-foreground">{task.title}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={11} />
                  {task.dueTime ? new Date(task.dueTime).toLocaleDateString() : "No due date"}
                </div>
                <p className="text-xs text-muted-foreground">{task.assignee.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
