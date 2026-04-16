# EventHub — Per-Person Task Breakdown

> Derived from the team roles in `tasks.md` and the actual project file structure.
> **Stack:** Next.js 15 · SQLite + Prisma · NextAuth v5 · Tailwind CSS · Groq Llama 3.3

---

## 1 · Harshith — Backend Dev 1
**Domain:** Auth · Events · Venues · Settings

### Schema & Core Libraries
- [x] `prisma/schema.prisma` — User, Account, Session, VerificationToken, Event, EventSession, Venue, Organization, OrgMember models
- [x] `prisma/seed.ts` — Seed users (multi-role), events, venues, organizations
- [x] `src/lib/prisma.ts` — Prisma client singleton
- [x] `src/lib/auth.ts` — NextAuth v5 config (Google OAuth provider, role in JWT/session)
- [x] `src/lib/roles.ts` — Role hierarchy helpers & permission checks

### API Routes
- [x] `src/app/api/auth/[...nextauth]/route.ts` — NextAuth catch-all handler
- [x] `src/app/api/auth/register/route.ts` — Registration stub (redirects to Google)
- [x] `src/app/api/events/route.ts` — GET (all roles) / POST (organizer+)
- [x] `src/app/api/events/[id]/route.ts` — GET / PUT (organizer+) / DELETE (admin+)
- [x] `src/app/api/events/[id]/ticket-types/route.ts` — CRUD ticket types for an event
- [x] `src/app/api/settings/profile/route.ts` — GET / PUT own profile
- [x] `src/app/api/settings/password/route.ts` — PUT (disabled for OAuth users)
- [x] `src/app/api/organizations/route.ts` — GET / POST organizations

### Environment
- [x] `.env.example` — Documented all required env vars
- [x] `.env.local` — Google OAuth + Groq API keys

---

## 2 · Siddharth — Backend Dev 2
**Domain:** Orders · Tickets · Volunteers · Tasks · Notifications

### Schema Models
- [x] `prisma/schema.prisma` — Order, OrderItem, Ticket, TicketTransfer, Payment, TicketType, VolunteerProfile, VolunteerRole, Shift, VolunteerApplication, VolunteerAssignment, Task, TaskAssignment, Notification, Feedback, Checkin, AssistLog models

### API Routes
- [x] `src/app/api/orders/route.ts` — GET (organizer+ sees all, attendee sees own) / POST (attendee+)
- [x] `src/app/api/tickets/route.ts` — GET (organizer+ sees all, others see own)
- [x] `src/app/api/volunteers/route.ts` — GET (admin+ to view all) / POST (any authenticated user to apply)
- [x] `src/app/api/volunteers/[id]/status/route.ts` — PUT approve/reject (admin+)
- [x] `src/app/api/tasks/route.ts` — GET / POST (organizer+ to create, volunteers see own)
- [x] `src/app/api/notifications/read-all/route.ts` — PUT mark all as read (own)
- [x] `src/app/api/checkins/route.ts` — POST scan (volunteer+)
- [x] `src/app/api/feedback/route.ts` — GET / POST event feedback
- [x] `src/app/api/users/route.ts` — GET all users (admin+)
- [x] `src/app/api/users/[id]/role/route.ts` — PUT change user role (super_admin)
- [x] `src/app/api/upload/route.ts` — POST file/image upload

---

## 3 · Thalin — Frontend / UI Person 1
**Domain:** Auth Pages · Dashboard · Layout · Analytics

### Layout & Navigation
- [x] `src/app/layout.tsx` — Root layout (fonts, metadata, Providers)
- [x] `src/app/page.tsx` — Landing/redirect page
- [x] `src/app/(dashboard)/layout.tsx` — Dashboard shell (Sidebar + main content)
- [x] `src/components/Sidebar.tsx` — Role-based nav, theme toggle, user info
- [x] `src/components/Providers.tsx` — SessionProvider wrapper
- [x] `src/components/ThemeProvider.tsx` — Light/dark theme context
- [x] `src/components/ThemeToggle.tsx` — Toggle button component

### Auth Pages
- [x] `src/app/(auth)/login/page.tsx` — Google "Sign in" page
- [x] `src/app/(auth)/register/page.tsx` — Redirect stub

### Dashboard & Analytics Pages
- [x] `src/app/(dashboard)/dashboard/page.tsx` — Main dashboard (stats cards, recent activity)
- [x] `src/app/(dashboard)/analytics/page.tsx` — Charts & analytics view

### Styling
- [x] `src/app/globals.css` — Design tokens, light/dark CSS vars, base styles
- [x] `tailwind.config.ts` — Tailwind config (darkMode, custom colors, fonts)

---

## 4 · Vishnu — Frontend / UI Person 2
**Domain:** Events · Orders · Tickets · Volunteers · Tasks · Orgs · Settings UI

### Event Pages
- [x] `src/app/(dashboard)/events/page.tsx` — Event listing page
- [x] `src/app/(dashboard)/events/new/page.tsx` — Create event form
- [x] `src/app/(dashboard)/events/[id]/page.tsx` — Event detail (tabs: overview, tickets, volunteers, tasks)
- [x] `src/app/(dashboard)/events/[id]/edit/page.tsx` — Edit event form

### Feature Pages
- [x] `src/app/(dashboard)/orders/page.tsx` — Orders list (role-filtered)
- [x] `src/app/(dashboard)/tickets/page.tsx` — Tickets list (role-filtered)
- [x] `src/app/(dashboard)/volunteers/page.tsx` — Volunteer management
- [x] `src/app/(dashboard)/tasks/page.tsx` — Task board
- [x] `src/app/(dashboard)/notifications/page.tsx` — Notifications list
- [x] `src/app/(dashboard)/settings/page.tsx` — Profile settings form
- [x] `src/app/(dashboard)/users/page.tsx` — User management (admin+)
- [x] `src/app/(dashboard)/organizations/page.tsx` — Org listing
- [x] `src/app/(dashboard)/organizations/new/page.tsx` — Create org page
- [x] `src/app/(dashboard)/organizations/new/NewOrgForm.tsx` — Org creation form component

### Shared UI Components (used by others)
- [x] `src/components/BuyTickets.tsx` — Ticket purchase modal
- [x] `src/components/EventRating.tsx` — Star rating + feedback component
- [x] `src/components/TicketTypeManager.tsx` — Ticket type CRUD in event form
- [x] `src/components/VolunteerApply.tsx` — Volunteer application form

---

## 5 · Tejal — Integrator
**Domain:** Wiring UI ↔ API · Middleware · Error States · Deployment

### Integration & Middleware
- [x] `src/middleware.ts` — Auth middleware (route protection, role checks)
- [x] Wire all dashboard pages to their respective API routes (fetch calls, SWR/hooks)
- [x] Error states — loading spinners, empty states, error boundaries across all pages
- [x] End-to-end data flow validation (create event → buy ticket → check in → feedback)

### Environment & Deployment
- [x] `.env.example` — Maintain and document for team
- [x] `.env.local` — All secrets configured and working
- [x] `npm run build` — Zero-error production builds
- [x] `npm run db:push` + `npm run db:seed` — Seed data pipeline verified
- [x] Deployment setup & final smoke test

### Cross-Cutting
- [x] Fetch helpers / shared hooks consumed by Thalin & Vishnu
- [x] Ensure role-based access is consistent between UI and API
- [x] Verify NextAuth session propagation through all protected routes

---

## 6 · Abhinav — AI Dev
**Domain:** All AI routes · All AI components · Pipelines

### AI Service Layer
- [x] `src/lib/ai.ts` — Groq SDK client + Llama 3.3 config, role-aware data filtering

### AI API Routes
- [x] `src/app/api/ai/chat/route.ts` — Conversational AI assistant (role-aware context)
- [x] `src/app/api/ai/insights/route.ts` — Event analytics insights (organizer+)
- [x] `src/app/api/ai/generate-description/route.ts` — Auto-generate event descriptions
- [x] `src/app/api/ai/generate-tasks/route.ts` — AI task generation for events
- [x] `src/app/api/ai/match-volunteers/route.ts` — Volunteer-to-role matching (admin+)

### AI UI Components
- [x] `src/components/AIAssistant.tsx` — Chat panel (used in dashboard)
- [x] `src/components/AIInsights.tsx` — Insight cards (used by Thalin in analytics)
- [x] `src/components/AITaskGenerator.tsx` — Task gen UI (used by Vishnu in events)
- [x] `src/components/AIDescriptionGenerator.tsx` — Description writer (used by Vishnu in event forms)

---

## Summary — Work Distribution

| Person | Files Owned | % of Codebase |
|--------|-------------|---------------|
| **Harshith** | 11 files (schema, auth, events API, settings API, orgs API, env) | ~18% |
| **Siddharth** | 12 files (schema models, orders/tickets/volunteers/tasks/notif/users API) | ~20% |
| **Thalin** | 13 files (layouts, auth pages, dashboard, analytics, sidebar, theme, CSS) | ~21% |
| **Vishnu** | 18 files (all feature pages, shared UI components) | ~21% |
| **Tejal** | Cross-cutting (middleware, wiring, env, deployment, validation) | ~10% |
| **Abhinav** | 10 files (AI service, 5 AI routes, 4 AI components) | ~10% |

> **Note:** Harshith & Siddharth share `schema.prisma` — Harshith owns the core/auth models, Siddharth owns the transactional/operational models. Both coordinate on migrations.
