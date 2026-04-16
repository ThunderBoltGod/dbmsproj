// src/app/(dashboard)/orders/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/roles";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  const session = await auth();
  const role = session!.user.role || "attendee";
  const isOrganizer = canAccess(role, "organizer");

  // Attendees/volunteers only see their own orders
  const orders = await prisma.order.findMany({
    where: isOrganizer ? {} : { userId: session!.user.id! },
    orderBy: { orderTime: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      event: { select: { entityName: true } },
      items: {
        include: { ticketType: { select: { name: true } } },
      },
      payment: { select: { provider: true, paidAt: true } },
    },
  });

  const revenue = orders
    .filter((o) => o.status === "confirmed")
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-foreground">
          {isOrganizer ? "Orders" : "My Orders"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {orders.length} orders
          {isOrganizer && ` · $${revenue.toFixed(2)} confirmed revenue`}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
        {[
          { label: "Total Orders",   value: orders.length },
          { label: "Confirmed",      value: orders.filter((o) => o.status === "confirmed").length },
          { label: "Pending",        value: orders.filter((o) => o.status === "pending").length },
          { label: "Cancelled",      value: orders.filter((o) => o.status === "cancelled").length },
        ].map(({ label, value }) => (
          <div key={label} className="card">
            <div className="stat-value">{value}</div>
            <p className="text-sm mt-1 text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Orders table */}
      <div className="card animate-fade-up">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {[...(isOrganizer ? ["Customer"] : []), "Event", "Items", "Total", "Payment", "Date", "Status"].map((h) => (
                  <th key={h} className="pb-3 text-left text-xs font-medium pr-4 text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  No orders yet
                </td></tr>
              ) : orders.map((order) => (
                <tr key={order.id} className="table-row">
                  {isOrganizer && (
                    <td className="py-3 pr-4">
                      <p className="font-medium text-foreground">{order.user.name}</p>
                      <p className="text-xs text-muted-foreground">{order.user.email}</p>
                    </td>
                  )}
                  <td className="py-3 pr-4 text-muted-foreground">
                    {order.event.entityName}
                  </td>
                  <td className="py-3 pr-4 text-xs text-muted-foreground">
                    {order.items.map((i) => `${i.ticketType.name}`).join(", ")}
                  </td>
                  <td className="py-3 pr-4 font-semibold mono text-emerald-600 dark:text-emerald-400">
                    ${Number(order.totalAmount).toFixed(2)}
                  </td>
                  <td className="py-3 pr-4 text-xs text-muted-foreground">
                    {order.payment?.provider ?? "—"}
                  </td>
                  <td className="py-3 pr-4 text-xs text-muted-foreground">
                    {new Date(order.orderTime).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <span className={`badge badge-${order.status}`}>{order.status}</span>
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
