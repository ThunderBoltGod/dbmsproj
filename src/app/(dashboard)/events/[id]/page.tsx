// src/app/(dashboard)/events/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/roles";
import { notFound } from "next/navigation";
import { Calendar, MapPin, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import AITaskGenerator from "@/components/AITaskGenerator";
import AIInsights from "@/components/AIInsights";
import BuyTickets from "@/components/BuyTickets";
import VolunteerApply from "@/components/VolunteerApply";
import EventRating from "@/components/EventRating";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  return { title: event?.entityName ?? "Event" };
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const role = session!.user.role || "attendee";
  const isOrganizer = canAccess(role, "organizer");
  const isAdmin = canAccess(role, "admin");

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      venue: true,
      org: true,
      creator: { select: { name: true, email: true } },
      sessions: { orderBy: { startTime: "asc" } },
      ticketTypes: { include: { _count: { select: { orderItems: true } } } },
      orders: {
        take: 10,
        orderBy: { orderTime: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          items: { include: { ticketType: { select: { name: true } } } },
        },
      },
      volunteerApplications: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { appliedAt: "desc" },
        take: 10,
      },
      _count: {
        select: { orders: true, volunteerApplications: true, feedback: true },
      },
    },
  });

  if (!event) notFound();

  // Check if current user already applied to volunteer
  const myVolunteerApp = await prisma.volunteerApplication.findUnique({
    where: { userId_eventId: { userId: session!.user.id!, eventId: id } },
  });

  // Fetch feedback/reviews for this event
  const allFeedback = await prisma.feedback.findMany({
    where: { eventId: id },
    orderBy: { submittedAt: "desc" },
    include: { user: { select: { name: true, image: true } } },
  });

  const myFeedback = allFeedback.find((f) => f.userId === session!.user.id);
  const ratingsOnly = allFeedback.filter((f) => f.rating !== null);
  const avgRating = ratingsOnly.length > 0
    ? ratingsOnly.reduce((sum, f) => sum + (f.rating || 0), 0) / ratingsOnly.length
    : 0;

  const totalRevenue = event.orders
    .reduce((sum, o) => sum + Number(o.totalAmount), 0)
    .toFixed(2);

  return (
    <div className="space-y-6">
      {/* Cover Image Banner */}
      {event.imageUrl && (
        <div className="relative w-full rounded-2xl overflow-hidden animate-fade-up" style={{ aspectRatio: "21/9" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.imageUrl} alt={event.entityName} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
        </div>
      )}

      {/* Back + header */}
      <div className="animate-fade-up">
        <Link href="/events" className="flex items-center gap-1.5 text-sm mb-4 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Back to Events
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">
                {event.entityName}
              </h1>
              <span className={`badge badge-${event.status}`}>{event.status}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {event.org.name}
              {event.venue && ` · ${event.venue.name}, ${event.venue.city}`}
            </p>
          </div>
          {isOrganizer && (
            <Link href={`/events/${event.id}/edit`} className="btn-outline">Edit</Link>
          )}
        </div>
      </div>

      {/* Quick stats */}
      {isOrganizer ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
          {[
            { label: "Revenue", value: `$${totalRevenue}`, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Orders", value: event._count.orders, color: "text-blue-600 dark:text-blue-400" },
            { label: "Volunteers", value: event._count.volunteerApplications, color: "text-amber-600 dark:text-amber-400" },
            { label: "Feedback", value: event._count.feedback, color: "text-purple-600 dark:text-purple-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="card">
              <div className={`stat-value ${color}`}>{value}</div>
              <p className="text-sm mt-1 text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 stagger">
          {[
            { label: "Ticket Types", value: event.ticketTypes.length, color: "text-blue-600 dark:text-blue-400" },
            { label: "Sessions", value: event.sessions.length, color: "text-amber-600 dark:text-amber-400" },
            { label: "Status", value: event.status, color: event.status === "published" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground" },
          ].map(({ label, value, color }) => (
            <div key={label} className="card">
              <div className={`stat-value ${color}`}>{value}</div>
              <p className="text-sm mt-1 text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details + Sessions */}
        <div className="lg:col-span-1 space-y-4">
          {/* Event details */}
          <div className="card">
            <h2 className="font-semibold mb-4 text-foreground">Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5 text-muted-foreground">
                <Calendar size={14} className="mt-0.5 shrink-0" />
                <div>
                  <p>{new Date(event.startTime).toLocaleDateString("en", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                  <p>{new Date(event.startTime).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })} – {new Date(event.endTime).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
              {event.venue && (
                <div className="flex items-start gap-2.5 text-muted-foreground">
                  <MapPin size={14} className="mt-0.5 shrink-0" />
                  <div>
                    <p>{event.venue.name}</p>
                    <p>{event.venue.address}, {event.venue.city}</p>
                    {event.venue.capacity && <p>Capacity: {event.venue.capacity.toLocaleString()}</p>}
                  </div>
                </div>
              )}
              {event.bio && (
                <p className="pt-2 border-t border-border text-muted-foreground">
                  {event.bio}
                </p>
              )}
            </div>
          </div>

          {/* Sessions */}
          <div className="card">
            <h2 className="font-semibold mb-4 text-foreground">
              Sessions <span className="text-sm font-normal text-muted-foreground">({event.sessions.length})</span>
            </h2>
            {event.sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions added</p>
            ) : (
              <div className="space-y-2.5">
                {event.sessions.map((s) => (
                  <div key={s.id} className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: s.color ?? "hsl(var(--primary))" }} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.startTime).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })} –{" "}
                        {new Date(s.endTime).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ticket types stats for organizers */}
          {isOrganizer && (
            <div className="card">
              <h2 className="font-semibold mb-4 text-foreground">Ticket Types (Admin View)</h2>
              <div className="space-y-3">
                {event.ticketTypes.map((tt) => (
                  <div key={tt.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{tt.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tt._count.orderItems} sold
                      </p>
                    </div>
                    <p className="text-sm font-semibold mono text-emerald-600 dark:text-emerald-400">
                      ${Number(tt.price).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Buy Tickets component visible to everyone */}
          <BuyTickets
            eventId={event.id}
            eventName={event.entityName}
            ticketTypes={event.ticketTypes.map((tt) => ({
              id: tt.id,
              name: tt.name,
              price: Number(tt.price),
            }))}
          />
        </div>

        {/* Orders + Volunteers — only for organizer+ */}
        <div className="lg:col-span-2 space-y-6">
          {isOrganizer ? (
            <>
              {/* Recent orders */}
              <div className="card">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-foreground">Recent Orders</h2>
                  <Link href={`/orders?event=${event.id}`} className="text-xs text-primary">
                    View all →
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {["Customer", "Tickets", "Amount", "Status"].map((h) => (
                          <th key={h} className="pb-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {event.orders.map((order) => (
                        <tr key={order.id} className="table-row">
                          <td className="py-3 pr-4">
                            <p className="font-medium text-foreground">{order.user.name}</p>
                            <p className="text-xs text-muted-foreground">{order.user.email}</p>
                          </td>
                          <td className="py-3 pr-4 text-xs text-muted-foreground">
                            {order.items.map((i) => `${i.qty}x ${i.ticketType.name}`).join(", ")}
                          </td>
                          <td className="py-3 pr-4 font-semibold mono text-foreground">
                            ${Number(order.totalAmount).toFixed(2)}
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

              {/* Volunteer applications */}
              {isAdmin && (
                <div className="card">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-semibold text-foreground">Volunteer Applications</h2>
                    <Link href={`/volunteers?event=${event.id}`} className="text-xs text-primary">
                      View all →
                    </Link>
                  </div>
                  {event.volunteerApplications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No applications yet</p>
                  ) : (
                    <div className="space-y-2">
                      {event.volunteerApplications.map((app) => (
                        <div key={app.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-primary/10 text-primary">
                            {app.user.name[0]}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{app.user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Applied {new Date(app.appliedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`badge badge-${app.status}`}>{app.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Attendee view — about + volunteer apply */
            <div className="space-y-6">
              <div className="card">
                <h2 className="font-semibold mb-4 text-foreground">About this Event</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {event.bio || "No description available for this event."}
                </p>
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Organized by <span className="text-foreground">{event.org.name}</span>
                    {event.creator && <> · Created by <span className="text-foreground">{event.creator.name}</span></>}
                  </p>
                </div>
              </div>

              {/* Volunteer Application */}
              <VolunteerApply
                eventId={event.id}
                eventName={event.entityName}
                existingStatus={myVolunteerApp?.status ?? null}
              />
            </div>
          )}
        </div>
      </div>

      {/* AI Section — only for organizers+ */}
      {isOrganizer && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AIInsights eventId={event.id} />
          <AITaskGenerator eventId={event.id} />
        </div>
      )}

      {/* Ratings & Reviews — visible to everyone */}
      <EventRating
        eventId={event.id}
        myRating={myFeedback?.rating ?? null}
        myComments={myFeedback?.comments ?? null}
        avgRating={avgRating}
        totalReviews={ratingsOnly.length}
        reviews={allFeedback.slice(0, 10).map((f) => ({
          id: f.id,
          rating: f.rating,
          comments: f.comments,
          submittedAt: f.submittedAt.toISOString(),
          user: { name: f.user.name, image: f.user.image },
        }))}
      />
    </div>
  );
}
