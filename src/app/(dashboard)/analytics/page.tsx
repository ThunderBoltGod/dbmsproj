// src/app/(dashboard)/analytics/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/roles";
import { BarChart3, TrendingUp, DollarSign, Users } from "lucide-react";
import { redirect } from "next/navigation";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const session = await auth();
  const role = session!.user.role || "attendee";

  // Only organizers+ can view analytics
  if (!canAccess(role, "organizer")) {
    redirect("/dashboard");
  }

  const [
    revenueByEvent,
    ordersByStatus,
    volunteersByEvent,
    ticketsByType,
    feedbackStats,
    recentCheckins,
  ] = await Promise.all([
    prisma.order.groupBy({
      by: ["eventId"],
      where: { status: "confirmed" },
      _sum: { totalAmount: true },
      _count: { id: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 8,
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.volunteerApplication.groupBy({
      by: ["eventId"],
      where: { status: "approved" },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    prisma.orderItem.groupBy({
      by: ["ticketTypeId"],
      _sum: { qty: true },
      _count: { id: true },
      orderBy: { _sum: { qty: "desc" } },
      take: 8,
    }),
    prisma.feedback.aggregate({
      _avg: { rating: true },
      _count: { id: true },
    }),
    prisma.checkin.count({
      where: { checkinTime: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  const eventIds = revenueByEvent.map((r) => r.eventId);
  const events = await prisma.event.findMany({
    where: { id: { in: eventIds } },
    select: { id: true, entityName: true },
  });
  const eventMap = Object.fromEntries(events.map((e) => [e.id, e.entityName]));

  const ttIds = ticketsByType.map((t) => t.ticketTypeId);
  const ticketTypes = await prisma.ticketType.findMany({
    where: { id: { in: ttIds } },
    select: { id: true, name: true },
  });
  const ttMap = Object.fromEntries(ticketTypes.map((t) => [t.id, t.name]));

  const totalRevenue = revenueByEvent.reduce((s, r) => s + Number(r._sum.totalAmount ?? 0), 0);
  const totalOrders  = ordersByStatus.reduce((s, o) => s + o._count.id, 0);
  const maxRevenue = Math.max(...revenueByEvent.map((r) => Number(r._sum.totalAmount ?? 0)));

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of your platform performance</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
        {[
          { label: "Total Revenue",     value: `$${totalRevenue.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Total Orders",      value: totalOrders,   icon: BarChart3,  color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { label: "Avg Rating",        value: feedbackStats._avg.rating ? `${feedbackStats._avg.rating.toFixed(1)} / 5` : "—", icon: TrendingUp, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
          { label: "Check-ins (7d)",    value: recentCheckins, icon: Users,     color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${bg}`}>
              <Icon size={18} className={color} />
            </div>
            <div className="stat-value">{value}</div>
            <p className="text-sm mt-1 text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Event */}
        <div className="card animate-fade-up">
          <h2 className="font-semibold mb-5 text-foreground">Revenue by Event</h2>
          <div className="space-y-3">
            {revenueByEvent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No confirmed orders yet</p>
            ) : revenueByEvent.map((row) => {
              const rev = Number(row._sum.totalAmount ?? 0);
              const pct = maxRevenue > 0 ? (rev / maxRevenue) * 100 : 0;
              return (
                <div key={row.eventId}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm truncate max-w-[60%] text-foreground">
                      {eventMap[row.eventId] ?? "Unknown"}
                    </p>
                    <span className="text-sm font-semibold mono text-emerald-600 dark:text-emerald-400">
                      ${rev.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-accent">
                    <div className="h-full rounded-full transition-all duration-700 bg-emerald-500"
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Orders by status */}
        <div className="card animate-fade-up">
          <h2 className="font-semibold mb-5 text-foreground">Orders by Status</h2>
          <div className="space-y-3">
            {ordersByStatus.map((row) => {
              const pct = totalOrders > 0 ? (row._count.id / totalOrders) * 100 : 0;
              const colorMap: Record<string, string> = {
                confirmed: "bg-emerald-500",
                pending:   "bg-amber-500",
                cancelled: "bg-red-500",
                refunded:  "bg-gray-400",
              };
              const barColor = colorMap[row.status] ?? "bg-blue-500";
              return (
                <div key={row.status}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${barColor}`} />
                      <span className="text-sm capitalize text-foreground">{row.status}</span>
                    </div>
                    <span className="text-sm font-semibold mono text-foreground">
                      {row._count.id} <span className="text-xs font-normal text-muted-foreground">({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-accent">
                    <div className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tickets sold by type */}
        <div className="card animate-fade-up">
          <h2 className="font-semibold mb-5 text-foreground">Tickets Sold by Type</h2>
          <div className="space-y-2.5">
            {ticketsByType.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tickets sold yet</p>
            ) : ticketsByType.map((row) => (
              <div key={row.ticketTypeId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <p className="text-sm text-foreground">
                  {ttMap[row.ticketTypeId] ?? "Unknown"}
                </p>
                <span className="text-sm font-semibold text-primary">
                  {row._sum.qty ?? 0} sold
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback summary */}
        <div className="card animate-fade-up">
          <h2 className="font-semibold mb-5 text-foreground">Feedback Summary</h2>
          <div className="flex items-center gap-6 mb-6">
            <div>
              <div className="text-5xl font-bold text-amber-500">
                {feedbackStats._avg.rating?.toFixed(1) ?? "—"}
              </div>
              <p className="text-sm mt-1 text-muted-foreground">Average rating</p>
            </div>
            <div>
              <div className="stat-value">{feedbackStats._count.id}</div>
              <p className="text-sm mt-1 text-muted-foreground">Total responses</p>
            </div>
          </div>
          {/* Star display */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const avg = feedbackStats._avg.rating ?? 0;
              const filled = star <= Math.round(avg);
              return (
                <svg key={star} width="20" height="20" viewBox="0 0 20 20" fill={filled ? "rgb(234 179 8)" : "currentColor"} className={filled ? "" : "text-border"}>
                  <path d="M10 1l2.39 4.84L18 6.74l-4 3.9.94 5.49L10 13.57l-4.94 2.56L6 10.64 2 6.74l5.61-.9L10 1z"/>
                </svg>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
