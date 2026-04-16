

> **Stack:** Next.js 15 · SQLite + Prisma · NextAuth v5 · Tailwind CSS · Anthropic Claude  
> **Team:** 6 people · Split by domain

---



| Person | Role | Domain |
|--------|------|--------|
| **Harshith** | Backend Dev 1 | Auth · Events · Venues · Settings |
| **Siddharth** | Backend Dev 2 | Orders · Tickets · Volunteers · Tasks · Notifications |
| **Thalin** | Frontend / UI Person 1 | Auth Pages · Dashboard · Layout · Analytics |
| **Vishnu** | Frontend / UI Person 2 | Events · Orders · Tickets · Volunteers · Tasks · Orgs · Settings UI |
| **Tejal** | Integrator | Wiring UI ↔ API · Middleware · Error States · Deployment |
| **Abhinav** | AI Dev | All AI routes · All AI components · Pipelines |














| Dependency | Who Writes | Who Uses |
|------------|-------------|--------------|
| `schema.prisma` (all models) | Harshith + Siddharth | Everyone |
| `src/lib/prisma.ts` | Harshith | Siddharth, Abhinav, Tejal |
| `src/lib/auth.ts` | Harshith | Tejal (middleware), all API routes |
| Shared UI components | Vishnu | Thalin, Abhinav |
| AI components | Abhinav | Thalin (`<AIInsights />`), Vishnu (`<AITaskGenerator />`, `<AIVolunteerMatcher />`, `<AIDescriptionWriter />`) |
| Fetch helpers / hooks | Tejal | Thalin, Vishnu |
| `.env.example` | Tejal | Everyone |

---



```bash
npm run dev          # Start dev server → http://localhost:3000
npm run build        # Production build
npm run db:push      # Sync schema to DB (dev)
npm run db:migrate   # Create migration (production)
npm run db:studio    # Visual DB browser → http://localhost:5555
npm run db:seed      # Re-seed sample data
```

---



1. **Harshith** sets up `schema.prisma` + `src/lib/prisma.ts` + `src/lib/auth.ts` first — everyone is unblocked once this is done
2. **Siddharth** added his models to schema, starts API routes in parallel
3. **Thalin** built layout, sidebar, and auth pages
4. **Vishnu** built all feature pages with mock/static data first
5. **Abhinav** building AI routes and components independently
6. **Tejal** wiring everything together once APIs and pages exist — runs end-to-end tests,make sures everything works as intended, deploys
