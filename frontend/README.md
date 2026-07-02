# LMS Frontend

React + TypeScript + Vite single-page application for the Leave Management System (leave, documents, performance reviews, reports).

## Prerequisites

- Node.js 18+
- The backend API running (locally on `http://localhost:3000`, or a deployed dev/prod API — see `src/contexts/AuthContext.tsx` for how `API_BASE_URL` is resolved per mode)

## Running locally

```bash
cd frontend
npm install
npm run dev        # starts Vite on http://localhost:5173
```

Other scripts:

```bash
npm run build      # production build to dist/
npm run build:dev  # build in development mode (dev API URL)
npm run preview    # serve the production build locally
npm run lint       # eslint
```

## Environment / feature flags

`frontend/.env` controls feature flags (all read via `import.meta.env`):

```env
VITE_FEATURE_ADMIN_DOCUMENTS=true
VITE_FEATURE_EMPLOYEE_DOCUMENTS=true
VITE_FEATURE_PERFORMANCE_ADMIN=true
VITE_FEATURE_PERFORMANCE=true
```

## Database migrations & seed scripts (backend)

The frontend expects the backend database to be migrated and seeded. All Prisma files live in **`backend/prisma/`** and use the `DATABASE_URL` from `backend/.env`.

```bash
cd backend
npm install
```

**1. Apply migrations** (schema changes in `backend/prisma/migrations/`):

```bash
npx prisma migrate deploy
```

**2. Regenerate the Prisma client** after any schema change (output goes to `backend/lib/generated/prisma`):

```bash
npx prisma generate
```

**3. Seed review questions** (required before using Performance Review — also creates the *Default Review Set*):

```bash
npx ts-node -r dotenv/config prisma/seed-review-questions.ts
```

**4. Seed application data** (departments, users, leave requests for the next 3 months, documents with onboarding auto-assign examples, and an active **test performance cycle** for the existing admin accounts):

```bash
npx ts-node -r dotenv/config prisma/seed.ts
```

Both seeds are idempotent — safe to run repeatedly. See the root [FEATURE_GUIDE.md](../FEATURE_GUIDE.md) for details on what each seed creates and how the test performance cycle works.

## Project layout

```
src/
├── pages/        # route-level pages (Dashboard, Leave, Documents, Performance Review, Reports…)
├── components/   # shared components (CalendarSection, DashboardLayout, admin modals…)
├── hooks/        # React Query hooks per feature (usePerformanceReview, useReviewQuestions…)
├── contexts/     # Auth + Theme providers (AuthContext exports API_BASE_URL and authFetch)
├── lib/          # helpers and constants
└── config/       # feature flags
```
