// src/app/(dashboard)/events/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/roles";
import Link from "next/link";
import { Calendar, MapPin, Users, Plus, Ticket, Star } from "lucide-react";

export const metadata = { title: "Events" };

export default async function EventsPage() {
  const session = await auth();
  const role = session!.user.role || "attendee";
  const isOrganizer = canAccess(role, "organizer");

  const events = await prisma.event.findMany({
    orderBy: { startTime: "asc" },
    include: {
      venue: true,
      org: { select: { name: true } },
      feedback: { select: { rating: true } },
      _count: {
        select: { orders: true, volunteerApplications: true, ticketTypes: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Events</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {events.length} event{events.length !== 1 ? "s" : ""} total
          </p>
        </div>
        {isOrganizer && (
          <Link href="/events/new" className="btn-primary">
            <Plus size={16} /> New Event
          </Link>
        )}
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="card text-center py-16">
          <Calendar size={40} className="mx-auto mb-4 text-muted-foreground/40" />
          <h3 className="font-semibold mb-2 text-foreground">No events yet</h3>
          <p className="text-sm mb-4 text-muted-foreground">Create your first event to get started</p>
          <Link href="/events/new" className="btn-primary inline-flex">
            <Plus size={16} /> Create Event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`}
              className="card group cursor-pointer block overflow-hidden"
              style={{ padding: 0 }}>
              
              {/* Cover Image */}
              {event.imageUrl ? (
                <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={event.imageUrl}
                    alt={event.entityName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {/* Badge on image */}
                  <div className="absolute top-3 left-3">
                    <span className={`badge badge-${event.status}`}>{event.status}</span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="text-xs font-mono px-2 py-1 rounded-md bg-black/40 text-white/80">
                      {event.org.name}
                    </span>
                  </div>
                </div>
              ) : (
                /* No image — show colored placeholder */
                <div className="relative w-full flex items-center justify-center bg-accent" style={{ aspectRatio: "16/9" }}>
                  <Calendar size={40} className="text-muted-foreground/20" />
                  <div className="absolute top-3 left-3">
                    <span className={`badge badge-${event.status}`}>{event.status}</span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="text-xs font-mono px-2 py-1 rounded-md bg-black/20 dark:bg-white/10 text-muted-foreground">
                      {event.org.name}
                    </span>
                  </div>
                </div>
              )}

              {/* Card content */}
              <div style={{ padding: "1rem 1.25rem 1.25rem" }}>
                {/* Event name */}
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors text-foreground">
                  {event.entityName}
                </h3>

                {/* Date */}
                <div className="flex items-center gap-1.5 text-sm mb-1 text-muted-foreground">
                  <Calendar size={13} />
                  {new Date(event.startTime).toLocaleDateString("en", {
                    weekday: "short", month: "short", day: "numeric", year: "numeric"
                  })}
                </div>

                {/* Venue */}
                {event.venue && (
                  <div className="flex items-center gap-1.5 text-sm mb-3 text-muted-foreground">
                    <MapPin size={13} />
                    {event.venue.name}, {event.venue.city}
                  </div>
                )}

                {/* Stats row */}
                {(() => {
                  const ratings = event.feedback.filter((f) => f.rating !== null);
                  const avg = ratings.length > 0 ? ratings.reduce((s, f) => s + (f.rating || 0), 0) / ratings.length : 0;
                  return (
                    <div className="flex items-center gap-4 pt-3 border-t border-border">
                      {avg > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <Star size={12} fill="rgb(234 179 8)" stroke="rgb(234 179 8)" />
                          <span className="text-yellow-600 dark:text-yellow-400">{avg.toFixed(1)}</span>
                          <span className="text-muted-foreground">({ratings.length})</span>
                        </div>
                      )}
                      {isOrganizer && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <ShoppingCartIcon />
                          {event._count.orders} orders
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Ticket size={12} />
                        {event._count.ticketTypes} ticket types
                      </div>
                    </div>
                  );
                })()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ShoppingCartIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 001.95 1.53h9.63a2 2 0 001.95-1.53L22 7H6"/>
    </svg>
  );
}
