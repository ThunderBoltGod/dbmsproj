// src/app/(dashboard)/tickets/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/roles";
import { QrCode } from "lucide-react";

export const metadata = { title: "Tickets" };

export default async function TicketsPage() {
  const session = await auth();
  const role = session!.user.role || "attendee";
  const isOrganizer = canAccess(role, "organizer");

  // Attendees/volunteers only see their own tickets
  const tickets = await prisma.ticket.findMany({
    where: isOrganizer ? {} : { attendeeUserId: session!.user.id! },
    orderBy: { issuedAt: "desc" },
    include: {
      attendeeUser: { select: { name: true, email: true } },
      orderItem: {
        include: {
          ticketType: { select: { name: true, price: true } },
          order: { include: { event: { select: { entityName: true } } } },
        },
      },
    },
  });

  const stats = {
    total: tickets.length,
    active: tickets.filter((t) => t.status === "active").length,
    used: tickets.filter((t) => t.status === "used").length,
    cancelled: tickets.filter((t) => t.status === "cancelled").length,
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-foreground">
          {isOrganizer ? "Tickets" : "My Tickets"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isOrganizer ? "All issued tickets across your events" : "Your event tickets"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
        {[
          { label: "Total Issued",      value: stats.total,     color: "text-blue-600 dark:text-blue-400" },
          { label: "Active",            value: stats.active,    color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Used (checked in)", value: stats.used,      color: "text-amber-600 dark:text-amber-400" },
          { label: "Cancelled",         value: stats.cancelled, color: "text-red-600 dark:text-red-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card">
            <div className={`stat-value ${color}`}>{value}</div>
            <p className="text-sm mt-1 text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Tickets table */}
      <div className="card animate-fade-up">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Ticket Code", ...(isOrganizer ? ["Attendee"] : []), "Event · Type", "Price", "Issued", "Status"].map((h) => (
                  <th key={h} className="pb-3 text-left text-xs font-medium pr-4 text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No tickets yet
                </td></tr>
              ) : tickets.map((ticket) => (
                <tr key={ticket.id} className="table-row">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5">
                      <QrCode size={13} className="text-primary" />
                      <span className="font-mono text-xs text-primary">
                        {ticket.ticketCode.slice(0, 12)}…
                      </span>
                    </div>
                  </td>
                  {isOrganizer && (
                    <td className="py-3 pr-4">
                      <p className="font-medium text-foreground">
                        {ticket.attendeeUser.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.attendeeUser.email}
                      </p>
                    </td>
                  )}
                  <td className="py-3 pr-4">
                    <p className="text-muted-foreground">
                      {ticket.orderItem.order.event.entityName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ticket.orderItem.ticketType.name}
                    </p>
                  </td>
                  <td className="py-3 pr-4 font-semibold mono text-emerald-600 dark:text-emerald-400">
                    ${Number(ticket.orderItem.ticketType.price).toFixed(2)}
                  </td>
                  <td className="py-3 pr-4 text-xs text-muted-foreground">
                    {new Date(ticket.issuedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <span className={`badge badge-${ticket.status}`}>{ticket.status}</span>
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
