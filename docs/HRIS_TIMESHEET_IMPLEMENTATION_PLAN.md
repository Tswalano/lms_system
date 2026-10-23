# HRIS Expansion & Client Timesheets — Assessment and Implementation Plan

> **Purpose:** Review the current LMS codebase, call out risks and unfinished modules, and lay out a plan to grow it into a BambooHR-style HR platform with a **client timesheet** module, where employees log time against client (non-internal) projects.
>
> **Status:** Proposal for review. This PR contains no code changes.
> **Date:** 2026-10-23

---

## 1. Where the system stands today

| Area | State | Notes |
|---|---|---|
| Auth (Cognito login, OTP, refresh, password reset) | ✅ Working | Backend never verifies the token signature (see R1) |
| Leave management (apply, approve, cancel, calendar, birthdays, Outlook sync, emails) | ✅ Working | No balance ledger; balances are derived from history |
| Document library (signing, versioning, expiry, audit, auto-assign) | ✅ Working | See ROADMAP §1 |
| Performance reviews (cycles, self/peer/manager, question sets) | 🚧 Mostly done | ROADMAP §2.2–2.6 still open |
| Notifications (in-app + SES) | 🚧 Working | Built on MySQL triggers (ROADMAP §5) |
| Reports | 🚧 Leave-only | 4 endpoints, behind a feature flag |
| Employee profile | ⚠️ Regressed | `UserProfilePage.tsx` still exists and routes to `/profile`, but the latest commit (`ad69f04`) removed its related configuration |
| Manager role, onboarding, leave automation, balances, payslips, integrations | 🔲 Not started | ROADMAP §3, §4, §6, §7, §9 |
| Timesheets / clients / projects | ❌ Absent | No tables, routes or pages |

**Stack:** React + Vite + shadcn/ui frontend. Hono on AWS Lambda behind API Gateway, deployed with CDK. MySQL on RDS via raw `mysql2` queries. Prisma is used only for the schema and migrations. Auth is Cognito, email is SES, schedulers run on EventBridge.

---

## 2. Risks (ranked)

### 🔴 Critical: fix before any new feature ships

**R1. JWTs are decoded but never verified.**
`backend/lambda/middleware/auth.ts:57` `validateToken()` calls `jwt.decode()` with no signature, issuer, audience or `kid` check. Anyone can forge a token with any `custom:userId` and `custom:role: admin` and get past `authMiddleware`.
*Fix:* verify with `aws-jwt-verify` (`CognitoJwtVerifier`) against the user pool JWKS, and check `token_use` and `client_id`/`aud`.

**R2. Admin endpoints have no authorization checks.**
Any logged-in user can call these:
- `POST /users/add-user`, `POST /users/update-user` (with `isAdmin: true`, a self-promotion path to admin), `DELETE /users/delete-user`, `POST /users/seed-departments` in `lambda/routes/user.ts`
- `PUT /leave/:id/approve` and `POST /leave/bulk-action` in `lambda/routes/leave.ts:487,620`, so employees can approve their own leave
- Every `/admin-docs/*` route in `lambda/routes/adminDoc.ts`
- `/reports/*`, `/notifications/send`, `/notifications/broadcast`

Only `performance.ts` and `performanceQuestions.ts` check roles, and each file has its own copy of `isAdmin()`.
*Fix:* add one `requireRole('admin' | 'manager' | 'hr')` middleware that reads the role from the **DB** (not the token claim) and mount it per router.

**R3. Unauthenticated email endpoints.**
`app.route('/test', testRoutes)` in `lambda/index.ts` exposes five `POST /test/*` routes that send SES email to any address with any body. That is an open relay: phishing that comes from your verified domain, plus SES reputation and suspension risk.
*Fix:* remove the routes from production builds, or gate them behind `NODE_ENV === 'development'` and admin auth.

**R4. The production database is reachable from the internet.**
`backend/lib/lms-backend-stack.ts:56-59` sets `ALLOW_PUBLIC_DB_ACCESS = true` and `ALLOWED_IP_RANGES = ['0.0.0.0/0']`, which opens 3306 to the world. The same file (`:150-155`) has a placeholder password and the prod RDS hostname in source.
*Fix:* put the Lambdas in the VPC's private subnets with an SG→SG rule, reach the DB through a bastion or SSM tunnel for admin work, and rotate the credentials.

### 🟠 High

**R5. Tokens are stored in `localStorage`** (`frontend/src/contexts/AuthContext.tsx:132-136`), including the refresh token, so any XSS leads to account takeover. Move the refresh token to an `HttpOnly; Secure; SameSite` cookie. The backend already reads the `sessionId` cookie.

**R6. A new DB connection per request with no pooling.** `DatabaseService.createConnection()` is called in 88 places, and each call fetches the Secrets Manager secret and opens a fresh TCP/TLS connection. This adds latency, risks exhausting RDS connections under load, and costs more in Secrets Manager calls. Cache the credentials and use a module-scoped `mysql.createPool` or RDS Proxy.

**R7. Schema drift between two sources of truth.** Prisma migrations, `prisma/sql-triggers.sql`, `backend/migration.sql`, `backend/sync.sql` and `prisma/playground.sql` all describe the schema. At runtime the code uses raw SQL, so the Prisma types never protect queries. Pick Prisma migrations as the single source and delete or archive the loose SQL files.

**R8. Business logic lives in MySQL triggers** (notifications). Triggers are invisible to tests and logs and hard to change safely. ROADMAP §5 already plans to replace them.

**R9. Thin test coverage.** The backend has 4 test files covering 10 routers of about 11k LOC. `adminDoc`, `performance`, `notifications` and `reports` have no tests. The frontend only tests `Pagination`, `usePagination` and two utility files. No integration tests run against MySQL.

### 🟡 Medium

- **R10. No audit log for HR data.** Changes to users, roles and leave are only partly logged (`leave_action_log`). HRIS compliance (POPIA/GDPR) needs a who/what/when trail for every personal-data change.
- **R11. No leave balance ledger.** Balances are computed. The `GET /leave-balance` route is commented out as a placeholder (`leave.ts:1647`), so there are no carry-overs, adjustments or accrual policies.
- **R12. Feature flags are build-time only** (`frontend/src/config/features.ts`). Turning a module on per tenant or role needs a rebuild. The backend has no matching gating, so APIs for "disabled" modules are still live.
- **R13. Hard-coded environment values.** These include `SECRET_NAME` and `DATABASE_NAME` TODOs in `databaseHeler.ts`, region `af-south-1`, and CloudFront origins in the CORS list.
- **R14. Very large route files.** `adminDoc.ts` (2.1k LOC), `leave.ts` (1.9k) and `performance.ts` (1.7k) mix validation, SQL, email and notifications. That makes them hard to review and test. Introduce a service/repository layer as new modules are added.
- **R15. Docs are out of sync.** The README describes `mobile/` and `mobile_web_app/` directories that don't exist. ROADMAP §10.5 says CDK template bundling is pending, while commit `2f6d4a1` suggests it's done; this needs checking.
- **R16. Personal data in S3.** Sick notes and documents are stored there. Confirm bucket encryption, presigned-URL TTLs and lifecycle and retention rules.

---

## 3. Unfinished modules (from code + ROADMAP)

| # | Module | What's missing |
|---|---|---|
| U1 | Performance reviews | Deadline enforcement (§2.2), employee results view (§2.3), delegation (§2.4), stats breakdown (§2.5), server-side peer anonymity (§2.6) |
| U2 | Leave automation | Stale-request reminders, auto-expiry, `expired` status (§3) |
| U3 | Leave balances | Ledger table, admin adjustments, accrual and carry-over policies (§4, R11) |
| U4 | Notifications | Trigger → event service migration (§5) |
| U5 | Onboarding | Templates, checklist, dashboard progress (§6) |
| U6 | Manager role | `role` enum, scoped approvals, sidebar (§7). The schema already has `managerId` and `user_role_type.manager`, but no route uses them for scoping |
| U7 | Mobile / PWA | Manifest, service worker, offline mode, bottom nav (§8) |
| U8 | Integrations | SimplePay payslips, iCal, Slack/Teams (§9) |
| U9 | Sentry | Error boundary + Support page wiring (`docs/tasks/sentry-bug-reporting.md`). `SupportPage` still only calls `console.log` |
| U10 | Employee profile | `/profile` page in a half-removed state after `ad69f04`; no self-service edit of personal, emergency or bank details |
| U11 | Reports | Leave-only; no headcount, turnover, document compliance or review analytics |

---

## 4. BambooHR gap analysis

| BambooHR capability | LMS today | Gap / plan phase |
|---|---|---|
| Employee records (personal, job, compensation, emergency contacts, custom fields) | Basic `users` row | **Phase 2:** employee profile with tabs, job history, compensation, emergency contacts, custom fields |
| Org chart & directory | `managerId` only | **Phase 2:** directory + org chart from `managerId` |
| Time off (policies, accruals, balances, calendar) | Requests + calendar | **Phase 1–2:** balance ledger, accrual policies, public holidays per country |
| **Time tracking / timesheets** | ❌ | **Phase 1 (this plan, §5)** |
| Onboarding / offboarding checklists | Doc auto-assign only | **Phase 3:** generic task templates for onboarding and offboarding |
| Performance management | ✅ mostly | Finish U1 |
| E-signatures & documents | ✅ | Done |
| Approvals & workflows | Leave only | **Phase 2:** shared approval engine (leave, timesheets, profile changes) |
| Self-service with approval of profile changes | ❌ | **Phase 2** |
| Reporting & analytics | Leave only | **Phase 3:** headcount, turnover, utilisation, billable hours |
| Payroll integration | ❌ | **Phase 3:** SimplePay (U8) + timesheet export |
| Roles & permissions | admin/user | **Phase 0–1:** admin, hr, manager, employee with a permission matrix |
| Audit trail | Docs + leave only | **Phase 0:** generic `audit_log` |
| Mobile | Responsive web | U7 |

---

## 5. Client Timesheet module: design

### 5.1 Requirements

1. Admins maintain **Clients** and **Projects**. A project is either **internal** (no client) or **client** (linked to a client).
2. Employees are **allocated** to projects for a date range, optionally with a role, billable flag and rate.
3. **Only employees with an active client-project allocation capture timesheets.** Employees who work only on internal projects are exempt. They don't see the timesheet nav item and get no reminders, unless an admin turns on `timesheet_required` for them, for example contractors.
4. Employees fill in a **weekly timesheet** (Mon–Sun) with daily hours per project and task, plus notes.
5. A timesheet goes **Draft → Submitted → Approved / Rejected**, and an admin can mark it **Locked** once it is exported or invoiced. Approval comes from the project manager, or the line manager as a fallback.
6. **Approved leave and public holidays pre-fill automatically**, so a week reconciles to the expected hours.
7. Reminders go out Friday afternoon when the week isn't submitted, and Monday morning to approvers when timesheets are pending.
8. Reports cover hours by client, project and employee; billable vs non-billable; utilisation %; and CSV/Excel export for invoicing and payroll.

### 5.2 Data model (Prisma, new migration `2026xxxx_add_timesheets`)

```prisma
model clients {
  id           String    @id @default(uuid()) @db.VarChar(36)
  name         String    @db.VarChar(255)
  code         String    @unique @db.VarChar(50)      // e.g. ACME
  contactName  String?   @db.VarChar(255)
  contactEmail String?   @db.VarChar(255)
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now()) @db.Timestamp(0)
  updatedAt    DateTime  @default(now()) @updatedAt @db.Timestamp(0)
  projects     projects[]
  @@map("clients")
}

model projects {
  id               String       @id @default(uuid()) @db.VarChar(36)
  clientId         String?      @db.VarChar(36)        // NULL => internal
  name             String       @db.VarChar(255)
  code             String       @unique @db.VarChar(50)
  type             project_type                         // internal | client
  isBillable       Boolean      @default(true)
  projectManagerId String?      @db.VarChar(36)        // timesheet approver
  startDate        DateTime?    @db.Date
  endDate          DateTime?    @db.Date
  budgetHours      Decimal?     @db.Decimal(10, 2)
  status           project_status @default(active)      // active | on_hold | closed
  createdAt        DateTime     @default(now()) @db.Timestamp(0)
  updatedAt        DateTime     @default(now()) @updatedAt @db.Timestamp(0)
  client           clients?     @relation(fields: [clientId], references: [id])
  projectManager   users?       @relation("ProjectManager", fields: [projectManagerId], references: [id])
  tasks            project_tasks[]
  allocations      project_allocations[]
  entries          timesheet_entries[]
  @@index([clientId])
  @@map("projects")
}

model project_tasks {            // optional task/activity codes per project
  id        String   @id @default(uuid()) @db.VarChar(36)
  projectId String   @db.VarChar(36)
  name      String   @db.VarChar(255)
  isBillable Boolean @default(true)
  isActive  Boolean  @default(true)
  project   projects @relation(fields: [projectId], references: [id], onDelete: Cascade)
  @@map("project_tasks")
}

model project_allocations {
  id           String    @id @default(uuid()) @db.VarChar(36)
  projectId    String    @db.VarChar(36)
  userId       String    @db.VarChar(36)
  role         String?   @db.VarChar(100)
  startDate    DateTime  @db.Date
  endDate      DateTime? @db.Date
  allocationPct Int      @default(100)
  billRate     Decimal?  @db.Decimal(10, 2)   // admin-only visibility
  project      projects  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user         users     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([projectId, userId, startDate])
  @@index([userId])
  @@map("project_allocations")
}

model timesheets {
  id           String           @id @default(uuid()) @db.VarChar(36)
  userId       String           @db.VarChar(36)
  weekStart    DateTime         @db.Date         // always a Monday
  status       timesheet_status @default(draft)  // draft|submitted|approved|rejected|locked
  totalHours   Decimal          @default(0) @db.Decimal(6, 2)
  submittedAt  DateTime?        @db.Timestamp(0)
  approvedById String?          @db.VarChar(36)
  approvedAt   DateTime?        @db.Timestamp(0)
  rejectionReason String?       @db.Text
  createdAt    DateTime         @default(now()) @db.Timestamp(0)
  updatedAt    DateTime         @default(now()) @updatedAt @db.Timestamp(0)
  user         users            @relation("TimesheetOwner", fields: [userId], references: [id])
  approvedBy   users?           @relation("TimesheetApprover", fields: [approvedById], references: [id])
  entries      timesheet_entries[]
  actions      timesheet_action_log[]
  @@unique([userId, weekStart])
  @@index([status])
  @@map("timesheets")
}

model timesheet_entries {
  id          String     @id @default(uuid()) @db.VarChar(36)
  timesheetId String     @db.VarChar(36)
  projectId   String?    @db.VarChar(36)     // NULL for leave/holiday rows
  taskId      String?    @db.VarChar(36)
  entryType   timesheet_entry_type @default(work) // work | leave | public_holiday
  workDate    DateTime   @db.Date
  hours       Decimal    @db.Decimal(4, 2)   // 0 < hours <= 24, 0.25 increments
  isBillable  Boolean    @default(true)       // snapshot at entry time
  notes       String?    @db.Text
  leaveRequestId BigInt?                      // links auto-filled leave
  timesheet   timesheets @relation(fields: [timesheetId], references: [id], onDelete: Cascade)
  project     projects?  @relation(fields: [projectId], references: [id])
  @@index([timesheetId])
  @@index([projectId, workDate])
  @@map("timesheet_entries")
}

model timesheet_action_log {
  id          BigInt   @id @default(autoincrement())
  timesheetId String   @db.VarChar(36)
  actorId     String?  @db.VarChar(36)
  action      String   @db.VarChar(50)   // submitted, approved, rejected, reopened, locked
  comment     String?  @db.Text
  createdAt   DateTime @default(now()) @db.Timestamp(0)
  timesheet   timesheets @relation(fields: [timesheetId], references: [id], onDelete: Cascade)
  @@index([timesheetId])
  @@map("timesheet_action_log")
}

model public_holidays {
  id        Int      @id @default(autoincrement())
  date      DateTime @db.Date
  name      String   @db.VarChar(255)
  country   String   @default("ZA") @db.VarChar(2)
  @@unique([date, country])
  @@map("public_holidays")
}

// users additions
//   timesheetRequired  Boolean?  // null = derive from allocations; true/false = admin override
//   standardHoursPerDay Decimal  @default(8.00)

enum project_type        { internal client }
enum project_status      { active on_hold closed }
enum timesheet_status    { draft submitted approved rejected locked }
enum timesheet_entry_type { work leave public_holiday }
```

**Who must submit a timesheet** for a given week:

```
timesheetRequired = users.timesheetRequired
                    ?? EXISTS(project_allocations a JOIN projects p
                              WHERE a.userId = :uid AND p.type = 'client'
                                AND a.startDate <= :weekEnd
                                AND (a.endDate IS NULL OR a.endDate >= :weekStart))
```

### 5.3 API (new routers `lambda/routes/clients.ts`, `projects.ts`, `timesheets.ts`)

| Method & path | Who | Purpose |
|---|---|---|
| `GET/POST/PUT/DELETE /clients[/:id]` | admin | Client CRUD (soft delete via `isActive`) |
| `GET/POST/PUT /projects[/:id]`, `/projects/:id/tasks` | admin (read: all) | Project and task CRUD |
| `GET/POST/PUT/DELETE /projects/:id/allocations` | admin | Allocate employees |
| `GET /timesheets/me/status` | employee | `{ required: bool, currentWeek, missingWeeks[] }`. Drives nav visibility and the dashboard banner |
| `GET /timesheets/me?weekStart=YYYY-MM-DD` | employee | Week with entries; lazily creates a draft and pre-fills leave and holidays |
| `GET /timesheets/me/projects?weekStart=` | employee | Projects the user may book to that week (active allocations + internal projects) |
| `PUT /timesheets/:id/entries` | owner | Replace the week's entries (bulk upsert) while `draft`/`rejected` |
| `POST /timesheets/:id/copy-previous` | owner | Copy last week's project/task rows (hours zeroed) |
| `POST /timesheets/:id/submit` | owner | Validate and submit; notify approvers |
| `POST /timesheets/:id/recall` | owner | Pull back while still `submitted` |
| `GET /timesheets/approvals?status=submitted` | manager/PM/admin | Queue scoped to projects they manage or their direct reports |
| `POST /timesheets/:id/approve`, `/reject` | approver | With comment; writes the action log and notifies |
| `POST /timesheets/bulk-action` | approver | Approve or reject several |
| `POST /timesheets/lock` | admin | Lock approved timesheets up to a date (period close) |
| `POST /timesheets/:id/reopen` | admin | Unlock with mandatory reason |
| `GET /timesheets/reports/hours` | admin/PM | Group by client/project/user/week; billable split; utilisation |
| `GET /timesheets/reports/export.csv` | admin | Invoicing/payroll export |
| `GET/POST/DELETE /public-holidays` | admin | Holiday calendar |

**Validation rules (zod, in `schemas/validationSchemas.ts`):**
- `weekStart` must be a Monday. Entries must fall within the week.
- `hours` must be in (0, 24] in 0.25 steps. A day can't exceed 24h in total.
- Work entries need a `projectId` the user is allocated to on `workDate` (internal projects are open to all), and the project must be `active`.
- Edits are only allowed in `draft`/`rejected`. No edits on future weeks beyond the current one.
- On submit, warn (not block) when total < expected (`standardHoursPerDay × working days` minus leave and holidays). Block if there are no work entries for a required user.
- Leave and holiday rows are system-generated and read-only to the employee.

### 5.4 Frontend

| Page / component | Route | Notes |
|---|---|---|
| `TimesheetPage.tsx` | `/timesheet` | Weekly grid: project/task rows × Mon–Sun columns, row and day totals, week picker, "Copy last week", Save draft, Submit; shows status badge and rejection reason |
| `TimesheetApprovalsPage.tsx` | `/timesheet-approvals` | Queue with filters (week, project, employee), expandable rows, approve or reject single and bulk. Mirrors `ApproveLeavePage` |
| `ClientsProjectsPage.tsx` | `/admin/clients-projects` | Tabs: Clients · Projects · Allocations · Public Holidays |
| `TimesheetReportsPage.tsx` | `/reports/timesheets` | Charts + table + CSV export (extend `ReportsPage`) |
| Dashboard widget | `/` | "Timesheet for week of X: Draft, 24/40h" card plus a missing-weeks banner |
| Sidebar | — | "Timesheet" shown only when `GET /timesheets/me/status.required` is true. "Approvals → Timesheets" shown for approvers |
| Feature flag | `features.timesheets` | `VITE_FEATURE_TIMESHEETS` |

Hooks: `useTimesheet(weekStart)`, `useTimesheetApprovals()`, `useProjects()`, following `usePerformanceReview.ts`.

### 5.5 Notifications & schedulers

- `backend/lambda/scheduled/timesheetReminderScheduler.ts`, on EventBridge:
  - **Fri 14:00 SAST:** required users whose current week isn't `submitted`/`approved` get an in-app notification and an email (`timesheetReminder.html`).
  - **Mon 08:00 SAST:** required users with a missing previous week get an escalation, and approvers get a digest of pending timesheets (`timesheetApprovalDigest.html`).
  - Dedupe through the `notifications` table (same pattern as `reviewCycleReminderScheduler`).
- Event-driven: submitted → approvers; approved/rejected → employee. Add a new `notification_category` value, `timesheets`.
- Register in CDK with the shared DLQ and an error alarm.

### 5.6 Integration with existing modules

- **Leave:** when leave is approved, auto-insert `leave` entries into the matching timesheets if they're still draft. When leave is cancelled, remove them. A submitted week containing changed leave gets flagged for review.
- **Users:** deactivating a user ends their open allocations (`endDate = deactivatedAt`).
- **Reports:** utilisation = billable hours ÷ (expected hours − leave − holidays).
- **Payroll (later):** the export feeds SimplePay (ROADMAP §9.1) for contractors paid hourly.

### 5.7 Permissions matrix

| Action | Employee | Project manager | Line manager | HR/Admin |
|---|---|---|---|---|
| Edit own draft timesheet | ✅ | ✅ (own) | ✅ (own) | ✅ |
| View others' timesheets | ❌ | Their projects' entries | Direct reports | All |
| Approve/reject | ❌ | Their projects | Direct reports (fallback when no PM) | All |
| Lock/reopen period | ❌ | ❌ | ❌ | ✅ |
| Manage clients/projects/allocations | ❌ | View own projects | ❌ | ✅ |
| See bill rates | ❌ | ❌ | ❌ | ✅ |

Rule for a week with entries across several projects: each PM approves their own project's rows (line-level), and the timesheet becomes `approved` when every line is approved. **MVP simplification:** a single approver, either the line manager or, if none, an admin. Line-level PM approval comes in Phase 2.

---

## 6. Phased delivery plan

### Phase 0: Security & foundations (must ship first, ~1–1.5 weeks)
1. Verify JWT signatures with `aws-jwt-verify` (R1). Add tests for forged, expired and wrong-pool tokens.
2. Add `requireRole()` middleware reading the role from the DB, applied to `/users` admin routes, `/admin-docs`, leave approve/bulk, `/reports` and notifications broadcast (R2). Add tests for 403 paths.
3. Remove `/test/*` from deployed builds (R3).
4. Lock down RDS ingress, move the Lambdas into the VPC (or use RDS Proxy), and rotate credentials (R4).
5. Add a pooled connection and cached secret in `DatabaseService` (R6).
6. Add a role model: extend `users.role` to `admin | hr | manager | employee` and backfill `user` → `employee`. This also covers ROADMAP §7 (U6).
7. Add a generic `audit_log` table and helper (R10).

### Phase 1: Timesheet MVP (~3 weeks)
1. Migration: clients, projects, tasks, allocations, timesheets, entries, action log, public holidays, plus the `users` additions.
2. Backend routers and zod schemas (§5.3), using a service layer (`lambda/services/timesheetService.ts`) rather than SQL in the route files.
3. Admin UI: Clients & Projects page with allocations and holidays.
4. Employee UI: weekly timesheet grid, dashboard widget, conditional sidebar entry.
5. Approver UI: approvals queue with a single approver (line manager → admin fallback).
6. Leave and holiday pre-fill.
7. Reminder scheduler and email templates.
8. Tests: unit (validation, "required" rule, totals), route tests (auth and state transitions), and a frontend grid component test.
9. Feature flag `timesheets` on in dev and staging, off in prod until UAT.

### Phase 2: HRIS core, BambooHR parity (~4–5 weeks)
1. Employee profile v2: personal, job, compensation (HR-only), emergency contacts and banking (encrypted), with job history (effective-dated `employment_history`). This resolves U10.
2. Self-service profile change requests with an approval workflow.
3. Directory and org chart.
4. Leave balance ledger, accrual policies and carry-over (U3), plus the leave automations (U2).
5. Line-level PM approval for timesheets, a timesheet reports page and CSV export.
6. Finish the open performance review items (U1).

### Phase 3: Workflows, analytics & integrations (~4 weeks)
1. Generic onboarding and offboarding checklists (U5), reusing document auto-assign.
2. Notification event service replacing triggers (U4).
3. HR analytics: headcount, turnover, utilisation and billable trends (U11).
4. SimplePay integration and payroll export (U8), plus iCal and Slack/Teams.
5. Sentry (U9), and PWA (U7) including mobile timesheet entry.

---

## 7. Testing & rollout

- Every new router gets Jest route tests in `backend/tests/` (pattern: `leave.test.ts`), covering the happy path, the 401/403 matrix and invalid state transitions.
- Add a MySQL service container to `pr-checks.yml` for integration tests of the migrations and queries.
- Migrations run in staging first, with a rollback script per `DEPLOYMENT_ROLLBACK_PLAN.md`.
- UAT with 1–2 client-project teams on staging for two weekly cycles before turning the flag on in prod.

## 8. Open questions for reviewers

1. **Approver:** should the line manager or the project manager approve timesheets in the MVP?
2. **Granularity:** is daily hours per project enough, or do clients require start/end times or task codes?
3. **Billing:** do we store bill and cost rates in the LMS, or only export hours to another invoicing tool?
4. **Internal-project time:** should client-allocated employees also log their internal-project hours, for full-week reconciliation and utilisation? *(Recommended: yes, since utilisation reporting needs it.)*
5. **Lock cadence:** lock monthly (month-end close) or weekly?
6. **Holiday calendars:** ZA only, or several countries?
7. **Contractors:** do some users need timesheets regardless of allocation (`timesheetRequired = true`)?

