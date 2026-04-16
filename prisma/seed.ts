// prisma/seed.ts
// Run with: npm run db:seed
// Creates sample data so you have something to look at on first launch
// With Google OAuth, users are created automatically on first sign-in.
// This seed creates placeholder users and sample data for development.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create users with different roles
  // In production, users are auto-created via Google OAuth sign-in.
  // These seed users let you test role-based access in Prisma Studio.

  const admin = await prisma.user.upsert({
    where: { email: "admin@eventhub.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@eventhub.com",
      phone: "+1 555 0100",
      role: "super_admin",
      status: "active",
    },
  });

  const organizer = await prisma.user.upsert({
    where: { email: "organizer@example.com" },
    update: {},
    create: {
      name: "Sarah Organizer",
      email: "organizer@example.com",
      phone: "+1 555 0102",
      role: "organizer",
      status: "active",
    },
  });

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      name: "Alice Johnson",
      email: "alice@example.com",
      phone: "+1 555 0101",
      role: "attendee",
      status: "active",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      name: "Bob Smith",
      email: "bob@example.com",
      role: "volunteer",
      status: "active",
    },
  });

  // Create organization
  const org = await prisma.organization.upsert({
    where: { id: "org-1" },
    update: {},
    create: {
      id: "org-1",
      name: "EventHub Productions",
      email: "hello@eventhubprod.com",
      phone: "+1 555 0200",
      status: "active",
    },
  });

  // Add admin as org owner
  await prisma.orgMember.upsert({
    where: { orgId_userId: { orgId: org.id, userId: admin.id } },
    update: {},
    create: {
      orgId: org.id,
      userId: admin.id,
      memberRole: "owner",
    },
  });

  // Add organizer as org staff
  await prisma.orgMember.upsert({
    where: { orgId_userId: { orgId: org.id, userId: organizer.id } },
    update: {},
    create: {
      orgId: org.id,
      userId: organizer.id,
      memberRole: "staff",
    },
  });

  // Create venue
  const venue = await prisma.venue.upsert({
    where: { id: "venue-1" },
    update: {},
    create: {
      id: "venue-1",
      name: "The Grand Hall",
      address: "123 Main Street",
      city: "San Francisco",
      capacity: 500,
    },
  });

  // Create events
  const event1 = await prisma.event.upsert({
    where: { id: "event-1" },
    update: {},
    create: {
      id: "event-1",
      orgId: org.id,
      venueId: venue.id,
      createdBy: organizer.id,
      entityName: "Tech Summit 2025",
      bio: "The premier technology conference of the year featuring speakers from across the industry.",
      status: "published",
      startTime: new Date("2025-06-15T09:00:00Z"),
      endTime: new Date("2025-06-15T18:00:00Z"),
      capacity: 300,
    },
  });

  const event2 = await prisma.event.upsert({
    where: { id: "event-2" },
    update: {},
    create: {
      id: "event-2",
      orgId: org.id,
      venueId: venue.id,
      createdBy: organizer.id,
      entityName: "Community Gala Night",
      bio: "An evening of celebration, music, and community.",
      status: "draft",
      startTime: new Date("2025-08-20T18:00:00Z"),
      endTime: new Date("2025-08-20T23:00:00Z"),
      capacity: 150,
    },
  });

  // Create ticket types
  const generalTicket = await prisma.ticketType.create({
    data: {
      eventId: event1.id,
      name: "General Admission",
      price: 49.99,
      salesStart: new Date("2025-03-01T00:00:00Z"),
      salesEnd: new Date("2025-06-14T23:59:59Z"),
    },
  });

  const vipTicket = await prisma.ticketType.create({
    data: {
      eventId: event1.id,
      name: "VIP Pass",
      price: 149.99,
      salesStart: new Date("2025-03-01T00:00:00Z"),
      salesEnd: new Date("2025-06-14T23:59:59Z"),
    },
  });

  // Create an order
  const order = await prisma.order.create({
    data: {
      userId: alice.id,
      eventId: event1.id,
      name: "Alice Johnson",
      status: "confirmed",
      totalAmount: 99.98,
      items: {
        create: [
          {
            ticketTypeId: generalTicket.id,
            qty: 2,
            unitPrice: 49.99,
          },
        ],
      },
      payment: {
        create: {
          provider: "stripe",
          currency: "USD",
          amount: 99.98,
          paidAt: new Date(),
          txnRef: "ch_test_abc123",
        },
      },
    },
    include: { items: true },
  });

  // Generate tickets for the order
  for (const item of order.items) {
    for (let i = 0; i < item.qty; i++) {
      await prisma.ticket.create({
        data: {
          orderItemId: item.id,
          attendeeUserId: alice.id,
          status: "active",
        },
      });
    }
  }

  // Create event sessions
  await prisma.eventSession.create({
    data: {
      eventId: event1.id,
      title: "Morning Keynote",
      startTime: new Date("2025-06-15T09:00:00Z"),
      endTime: new Date("2025-06-15T10:30:00Z"),
      color: "#6366f1",
      capacity: 300,
    },
  });

  await prisma.eventSession.create({
    data: {
      eventId: event1.id,
      title: "Workshop: AI in Practice",
      startTime: new Date("2025-06-15T11:00:00Z"),
      endTime: new Date("2025-06-15T12:30:00Z"),
      color: "#10b981",
      capacity: 80,
    },
  });

  // Create volunteer role and profile
  await prisma.volunteerProfile.upsert({
    where: { userId: bob.id },
    update: {},
    create: {
      userId: bob.id,
      skills: "Event coordination, First aid certified",
      availabilityNotes: "Available weekends and evenings",
      backgroundCheckStatus: "approved",
    },
  });

  const role = await prisma.volunteerRole.create({
    data: {
      eventId: event1.id,
      name: "Registration Desk",
      description: "Greet attendees and manage check-in",
    },
  });

  // Create notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: alice.id,
        eventId: event1.id,
        title: "Order Confirmed",
        body: "Your order for Tech Summit 2025 has been confirmed. Check your tickets below.",
        channel: "in_app",
        read: false,
      },
      {
        userId: bob.id,
        eventId: event1.id,
        title: "Volunteer Application",
        body: "Your volunteer application for Tech Summit 2025 is under review.",
        channel: "in_app",
        read: true,
      },
    ],
  });

  console.log("✅ Seed complete!");
  console.log("─────────────────────────────");
  console.log("Seeded users (sign in with Google using these emails,");
  console.log("or change roles in Prisma Studio):");
  console.log("");
  console.log("  admin@eventhub.com     → super_admin");
  console.log("  organizer@example.com  → organizer");
  console.log("  alice@example.com      → attendee");
  console.log("  bob@example.com        → volunteer");
  console.log("─────────────────────────────");
  console.log("");
  console.log("To change a user's role:");
  console.log("  npm run db:studio → users table → edit role column");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
