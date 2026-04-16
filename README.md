# EventHub 🎟️

AI-powered event management platform — synchronized ticketing, volunteer coordination, and real-time analytics.

Built with **Next.js 15**, **SQLite** (via Prisma), **NextAuth v5** (Google OAuth), **Tailwind CSS**, and **Groq Llama 3.3**.

---

## What's Inside

| Layer | Tech | Purpose |
|---|---|---|
| Framework | Next.js 15 (App Router) | Full-stack React with server components |
| Database | SQLite + Prisma ORM | Local-first, zero cloud setup |
| Auth | NextAuth v5 (Google OAuth) | JWT sessions, Google sign-in |
| Styling | Tailwind CSS + DM Sans | Custom light/dark design system |
| AI | Groq SDK + Llama 3.3 70B | Role-aware chat, insights, task gen, description writer |
| UI Components | Radix UI + Lucide Icons | Accessible primitives & icon library |

### Database — 22 Tables

```
Users              Organizations      OrgMembers
Venues             Events             EventSessions
TicketTypes        Orders             OrderItems
Tickets            TicketTransfers    Payments
Checkins           VolunteerProfiles  VolunteerRoles
Shifts             VolunteerApplications  VolunteerAssignments
Tasks              TaskAssignments    Notifications
Feedback           AssistLog (audit trail)
```

---

## AI Features

Groq-powered Llama 3.3 is built in natively — not bolted on. All AI routes are **role-aware**: financial data (revenue, payments) is only visible to organizer+ roles.

| Feature | What it does |
|---|---|
| **AI Assistant** | Chat with Llama about your live event data on any page |
| **AI Insights** | Auto-generated bullet-point dashboard analysis |
| **AI Task Generator** | Full pre/post event checklist, saved to DB in one click |
| **AI Description Writer** | Generate polished event bios from minimal input |
| **AI Volunteer Matcher** | Match approved volunteers to shifts by skills & availability |

---

## Quick Start

### 1 — Install dependencies
```bash
npm install
```

### 2 — Set up environment
```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:
```env
# Auth
AUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth — get from https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Database (SQLite — no cloud needed)
DATABASE_URL="file:./prisma/dev.db"

# AI — Groq (Llama 3.3 70B, free tier: 30 req/min)
# Get your API key from https://console.groq.com
GROQ_API_KEY="gsk_..."
```

> If you don't have a Groq API key yet, leave `GROQ_API_KEY` as a placeholder — the app still works, AI features will show a friendly fallback message.

### 3 — Set up the database
```bash
npm run db:push    # creates the SQLite database and all tables
npm run db:seed    # loads sample events, users, tickets, and orders
```

### 4 — Start the server
```bash
npm run dev
```

Open **http://localhost:3000** — sign in with Google to get started.

---

## Role-Based Access Control

EventHub uses a 5-tier role hierarchy. Each role inherits all permissions of the roles below it.

| Role | Access Level |
|---|---|
| `super_admin` | Full platform control, user role management |
| `admin` | Volunteer management, volunteer matching |
| `organizer` | Event CRUD, orders, analytics, AI insights |
| `volunteer` | Check-in scanning, assigned tasks |
| `attendee` | Browse events, buy tickets, submit feedback |

---

## Team — 6 People

| # | Person | Role | Owns |
|---|---|---|---|
| 🔧 | **Harshith** | Backend Dev 1 | Prisma schema, NextAuth, `/api/auth/`, `/api/events/`, `/api/settings/`, `/api/organizations/` |
| 🔧 | **Siddharth** | Backend Dev 2 | `/api/orders/`, `/api/tickets/`, `/api/checkins/`, `/api/volunteers/`, `/api/tasks/`, `/api/notifications/`, `/api/users/` |
| 🎨 | **Thalin** | Frontend / UI 1 | Login, Dashboard, Sidebar, `globals.css`, Analytics, Theme system |
| 🎨 | **Vishnu** | Frontend / UI 2 | Events, Orders, Tickets, Volunteers, Tasks, Orgs, Settings + shared components |
| 🔗 | **Tejal** | Integrator | Wires UI ↔ API, middleware, error states, deployment, end-to-end testing |
| 🤖 | **Abhinav** | AI Dev | `/api/ai/*` routes + all 4 AI components, prompt engineering |

> See `tasks.md` for role details and `task2.md` for the full per-person file breakdown.

---

## Available Pages

| Route | What it does |
|---|---|
| `/login` | Google OAuth sign-in |
| `/dashboard` | Stats overview, upcoming events, recent orders, AI insights |
| `/events` | Events grid with search & filters |
| `/events/new` | Create a new event |
| `/events/[id]` | Event detail — overview, tickets, volunteers, tasks |
| `/events/[id]/edit` | Edit event details |
| `/tickets` | All issued tickets |
| `/orders` | Orders with payment info |
| `/volunteers` | Applications + approve/reject |
| `/tasks` | Task tracker by priority |
| `/notifications` | User notifications |
| `/analytics` | Revenue, attendance, feedback charts |
| `/organizations` | Org management |
| `/organizations/new` | Create a new organization |
| `/settings` | Profile settings |
| `/users` | User management (admin+) |

---

## API Routes

All endpoints require authentication unless noted. Role guards are enforced server-side.

```
Auth
  POST  /api/auth/register             — Stub (redirects to Google OAuth)
  *     /api/auth/[...nextauth]         — NextAuth handler (Google provider)

Events
  GET   /api/events                    — List events (all roles)
  POST  /api/events                    — Create event (organizer+)
  GET   /api/events/[id]               — Event details (all roles)
  PUT   /api/events/[id]               — Update event (organizer+)
  DELETE /api/events/[id]              — Delete event (admin+)
  GET   /api/events/[id]/ticket-types  — List ticket types
  POST  /api/events/[id]/ticket-types  — Create ticket type (organizer+)

Orders & Tickets
  GET   /api/orders                    — List orders (organizer+ = all, attendee = own)
  POST  /api/orders                    — Create order + auto-generate tickets
  GET   /api/tickets                   — List tickets (organizer+ = all, others = own)
  POST  /api/checkins                  — Check in by ticket code (volunteer+)

Volunteers
  GET   /api/volunteers                — List applications (admin+)
  POST  /api/volunteers                — Apply to volunteer (any authenticated)
  PUT   /api/volunteers/[id]/status    — Approve or reject (admin+)

Tasks & Notifications
  GET   /api/tasks                     — List tasks (organizer+ = all, volunteer = own)
  POST  /api/tasks                     — Create task + notify assignee (organizer+)
  PUT   /api/notifications/read-all    — Mark all read (own)

Users & Settings
  GET   /api/users                     — List all users (admin+)
  PUT   /api/users/[id]/role           — Change user role (super_admin)
  GET   /api/settings/profile          — Get own profile
  PUT   /api/settings/profile          — Update own profile
  PUT   /api/settings/password         — Change password (disabled for OAuth)

Organizations
  GET   /api/organizations             — List organizations
  POST  /api/organizations             — Create organization

Feedback & Upload
  GET   /api/feedback                  — List feedback
  POST  /api/feedback                  — Submit feedback
  POST  /api/upload                    — Upload file/image

AI (all require organizer+ unless noted)
  POST  /api/ai/chat                   — AI assistant (role-aware context)
  POST  /api/ai/generate-description   — Write event bio
  POST  /api/ai/generate-tasks         — Generate + save task checklist
  GET   /api/ai/insights               — Platform or event-level summary
  POST  /api/ai/match-volunteers       — Match volunteers to shift (admin+)
```

---

## Useful Commands

```bash
npm run dev          # Start dev server → http://localhost:3000
npm run build        # Build for production
npm run db:push      # Sync schema to database
npm run db:migrate   # Create migration file (production-safe)
npm run db:studio    # Visual database browser → http://localhost:5555
npm run db:seed      # Re-seed sample data
```

---

## Project Structure

```
eventhub/
├── prisma/
│   ├── schema.prisma          ← All 22 database tables
│   ├── seed.ts                ← Sample data seeder
│   └── dev.db                 ← SQLite database file
├── src/
│   ├── app/
│   │   ├── (auth)/            ← Login & Register pages
│   │   ├── (dashboard)/       ← All protected pages
│   │   │   ├── analytics/
│   │   │   ├── dashboard/
│   │   │   ├── events/        ← list, [id], [id]/edit, new
│   │   │   ├── notifications/
│   │   │   ├── orders/
│   │   │   ├── organizations/ ← list, new
│   │   │   ├── settings/
│   │   │   ├── tasks/
│   │   │   ├── tickets/
│   │   │   ├── users/
│   │   │   ├── volunteers/
│   │   │   └── layout.tsx     ← Dashboard shell
│   │   ├── api/
│   │   │   ├── ai/            ← 5 AI endpoints
│   │   │   ├── auth/          ← NextAuth + register
│   │   │   ├── checkins/
│   │   │   ├── events/
│   │   │   ├── feedback/
│   │   │   ├── notifications/
│   │   │   ├── orders/
│   │   │   ├── organizations/
│   │   │   ├── settings/      ← profile + password
│   │   │   ├── tasks/
│   │   │   ├── tickets/
│   │   │   ├── upload/
│   │   │   ├── users/
│   │   │   └── volunteers/
│   │   ├── globals.css        ← Design tokens, light/dark vars
│   │   ├── layout.tsx         ← Root layout
│   │   └── page.tsx           ← Landing redirect
│   ├── components/
│   │   ├── AIAssistant.tsx    ← Chat panel
│   │   ├── AIDescriptionGenerator.tsx
│   │   ├── AIInsights.tsx     ← Insight cards
│   │   ├── AITaskGenerator.tsx
│   │   ├── BuyTickets.tsx     ← Ticket purchase modal
│   │   ├── EventRating.tsx    ← Star rating + feedback
│   │   ├── Providers.tsx      ← SessionProvider wrapper
│   │   ├── Sidebar.tsx        ← Role-based navigation
│   │   ├── ThemeProvider.tsx   ← Light/dark theme context
│   │   ├── ThemeToggle.tsx    ← Toggle button
│   │   ├── TicketTypeManager.tsx
│   │   └── VolunteerApply.tsx ← Volunteer application form
│   └── lib/
│       ├── ai.ts              ← Groq SDK client + Llama config
│       ├── auth.ts            ← NextAuth v5 config (Google)
│       ├── prisma.ts          ← Prisma client singleton
│       └── roles.ts           ← Role hierarchy + permission checks
├── .env.example               ← Copy to .env.local
├── .env.local                 ← Local secrets (not committed)
├── middleware.ts              ← Route protection
├── tailwind.config.ts         ← Tailwind config
├── tasks.md                   ← Team roles & ownership
├── task2.md                   ← Per-person file breakdown
└── package.json
```

---

## Tech Stack Details

| Package | Version | Purpose |
|---|---|---|
| `next` | 15.5 | App Router, server components, API routes |
| `react` | 18.3 | UI rendering |
| `next-auth` | 5.0 beta | Google OAuth, JWT sessions |
| `@prisma/client` | 5.22 | Database ORM |
| `groq-sdk` | 1.1 | Llama 3.3 70B inference |
| `@radix-ui/*` | various | Accessible UI primitives (dialog, tabs, select, etc.) |
| `lucide-react` | 0.460 | Icon library |
| `tailwindcss` | 3.4 | Utility-first CSS |
| `zod` | 3.23 | Runtime schema validation |
| `bcryptjs` | 2.4 | Password hashing (legacy support) |

---

---

## Potential Next Features

- **Stripe integration** — Real payment processing
- **QR code scanner** — Camera-based check-in
- **Email notifications** — SMTP via Resend
- **Ticket PDF generation** — Downloadable ticket with QR code
- **Real-time updates** — Live dashboard via Server-Sent Events
- **Multi-language support** — i18n for global events
