# LMS Application — Feature Roadmap

> Status legend: ✅ Done · 🔲 Pending · 🚧 In Progress · ⚠️ Blocked

---

## 0. Outlook Calendar Integration ✅ Complete

**Goal:** When a leave request is approved, create an OOF calendar event on the shared org leave calendar and the employee's personal calendar. Delete both events when the leave is cancelled.

### Database
- ✅ `outlook_shared_event_id VARCHAR(512)` added to `leave_requests` (in schema.prisma + migration run)
- ✅ `outlook_personal_event_id VARCHAR(512)` added to `leave_requests` (in schema.prisma + migration run)
- ✅ `LeaveRequest` interface in `leaveHelpers.ts` updated with both optional fields

### Backend
- ✅ `backend/lambda/integrations/outlookCalendar.ts` — Microsoft Graph API integration
  - ✅ `getAzureCredentials()` — reads from env vars (local dev) or AWS Secrets Manager (Lambda)
  - ✅ `getGraphToken()` — client credentials flow, no user delegation required
  - ✅ `createLeaveEvents()` — creates all-day OOF event on shared mailbox + employee personal calendar; returns both Graph event IDs; failures are independent (one failing does not block the other)
  - ✅ `deleteLeaveEvents()` — deletes both events; treats 404 as success; failures are independent
  - ✅ Event payload: `isAllDay: true`, `showAs: "oof"`, `attendees: []` (no email invitations sent), `Africa/Johannesburg` timezone, MS Graph exclusive end date convention (end = last day + 1)
- ✅ `backend/lambda/routes/leave.ts` — approval route calls `createLeaveEvents()` and persists event IDs to DB (fire-and-forget; never blocks approval response)
- ✅ `backend/lambda/routes/leave.ts` — cancellation route calls `deleteLeaveEvents()` when event IDs are present (fire-and-forget)
- ✅ `backend/.env` — `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_CALENDAR_SECRET_NAME`, `OUTLOOK_SHARED_MAILBOX` added for local dev

### Tests
- ✅ `backend/tests/outlookCalendar.test.ts` — 27 unit tests covering token acquisition, event creation, event deletion, partial failures, and error cases

### Scripts
- ✅ `backend/scripts/testOutlookCalendar.ts` — local smoke test (`npx ts-node -r dotenv/config scripts/testOutlookCalendar.ts`)

### Outstanding — manual setup required (no code changes needed)
- 🔲 **M365 Admin:** Create shared mailbox `leave-calendar@disraptor.co.za` in Microsoft 365 Admin Center → Teams & groups → Shared mailboxes. Grant all org users Read access to its calendar so they can subscribe.
- 🔲 **AWS Secrets Manager:** Add `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` as keys inside the `lmsDevelopment` secret so the production Lambda can read them (local dev uses `.env` directly).

### Optional extension — OOF email auto-reply (not yet implemented)
The Graph API can also toggle the employee's Outlook **automatic email reply** (the "I'm out of office" message) when leave is approved, and clear it when the leave ends or is cancelled. This is separate from the calendar event. Uses `PATCH /users/{email}/mailboxSettings` with `automaticRepliesSetting`. Not currently implemented — raise as a separate task if wanted.

---

## 1. Reporting & Analytics

**Goal:** Give HR and admins visibility into leave trends, department coverage, and org-wide patterns without exporting to Excel.

### Database — no schema changes needed (all data already exists in `leave_requests`, `users`, `departments`)

### Backend
- 🔲 New route file `backend/lambda/routes/reports.ts` mounted at `/api/reports`
- 🔲 `GET /api/reports/leave-summary` — total leave days taken per employee per leave type for a given period
- 🔲 `GET /api/reports/department-coverage` — for each department, how many employees are on leave on each date (identify coverage gaps)
- 🔲 `GET /api/reports/peak-periods` — group leave by month/week to show high-demand periods
- 🔲 `GET /api/reports/leave-type-breakdown` — org-wide split of leave types (annual, sick, etc.) as percentages
- 🔲 Register `/api/reports` in the main Lambda handler (`backend/lambda/index.ts`)

### Frontend
- 🔲 New page `frontend/src/pages/ReportsPage.tsx`
- 🔲 Add "Reports" nav item under **Administration** in `Sidebar.tsx`
- 🔲 Add route `/reports` in `App.tsx` (admin-only guard)
- 🔲 Summary stat cards (total leave days taken this year, avg per employee, most common leave type)
- 🔲 Bar chart — leave days per department (use `recharts` or `chart.js`)
- 🔲 Line chart — leave requests over time (monthly trend)
- 🔲 Table — individual employee leave summary, sortable by name/department/days taken
- 🔲 Date range filter (current quarter, current year, custom range)
- 🔲 CSV export button for the summary table

---

## 2. Bulk Approvals ✅ Complete

**Goal:** Allow admins and managers to approve or reject multiple pending leave requests in one action instead of one at a time.

### Database — no schema changes needed

### Backend
- ✅ `POST /leave/bulk-action` — accepts `{ leaveIds: number[], action: 'approve' | 'reject', feedback?: string }`
- ✅ Runs each approval/rejection in its own transaction; partial failures return a per-ID result map
- ✅ Fires SES email and Outlook calendar event for each approved request (fire-and-forget per item)
- ✅ Writes to `leave_action_log` for each actioned request
- ✅ Returns `{ succeeded, failed, results[] }` — partial success is handled gracefully

### Frontend
- ✅ Checkbox on each pending request card
- ✅ "Select all / Deselect all" toggle in the pending section header
- ✅ Floating action bar appears at the bottom when ≥1 row is selected — shows count, Approve all, Reject all, and clear (×)
- ✅ Bulk confirmation modal lists all selected employees with leave type and duration
- ✅ Feedback/comment field in modal (applied to all selected)
- ✅ Selected card highlighted with blue ring; selected cards stay highlighted until data refreshes
- ✅ Toast after bulk action: success toast if all pass, warning toast if partial failure (failed items remain pending)

---

## 3. Performance Reviews 🚧 In Progress

**Goal:** A structured quarterly review cycle where each engineer completes a self-review, is rated by their manager, and receives anonymous peer feedback from 3 randomly assigned colleagues. HR can see the aggregated scores. Mirrors the existing Excel appraisal format.

> **Frontend: ✅ Complete** — All four pages (`PerformanceReviewAdmin`, `PerformanceReviewEmployee`, `PerformanceReviewPeerPage`, `PerformanceReviewSubmissionsPage`) are built and working against a local in-memory mock store. Weighted scoring, manager overrides, peer aggregation, and the full cycle UI are in place.
>
> **Backend integration: 🔲 Pending** — See [`PERFORMANCE_REVIEW_INTEGRATION.md`](./PERFORMANCE_REVIEW_INTEGRATION.md) for the full task breakdown (DB migrations → API routes → frontend rewiring → notifications).

### 3.1 Review Structure (based on Excel sheets)

| Review Type | Who fills it | Visible to |
|---|---|---|
| Self-Review | The engineer | Manager, HR |
| Manager Appraisal | Direct manager | HR, Engineer (after cycle closes) |
| Peer Review (×3) | 3 randomly assigned peers | HR, Manager (anonymised) |
| Next Steps | Manager + Engineer jointly | Both |

---

### 3.2 Database Schema Changes

The existing `performance_reviews`, `review_questions`, `review_responses`, and `manager_feedback` tables cover the self-review and manager appraisal flow but are missing peer review assignment tracking and weighted scoring. The following changes are required:

#### New table — `review_cycles`
Manages the quarterly review period. Triggering a new cycle kicks off random peer assignments for all active employees.
```sql
CREATE TABLE review_cycles (
  id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name        VARCHAR(100) NOT NULL,        -- e.g. "Q2 2025"
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  status      ENUM('draft','active','closed') DEFAULT 'draft',
  created_by  VARCHAR(36),
  createdAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```
- 🔲 Add `review_cycles` model to `schema.prisma`
- 🔲 Run migration

#### New table — `peer_review_assignments`
Tracks which 3 peers are randomly assigned to review each engineer per cycle. Assignment is created by the system when a cycle goes `active`.
```sql
CREATE TABLE peer_review_assignments (
  id                   VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  cycle_id             VARCHAR(36) NOT NULL,
  reviewee_id          VARCHAR(36) NOT NULL,   -- engineer being reviewed
  reviewer_id          VARCHAR(36) NOT NULL,   -- peer doing the review
  status               ENUM('pending','in_progress','completed') DEFAULT 'pending',
  performance_review_id VARCHAR(36) NULL,      -- linked once reviewer starts
  assigned_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at         TIMESTAMP NULL,
  FOREIGN KEY (cycle_id)    REFERENCES review_cycles(id),
  FOREIGN KEY (reviewee_id) REFERENCES users(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id),
  FOREIGN KEY (performance_review_id) REFERENCES performance_reviews(id),
  UNIQUE KEY uq_assignment (cycle_id, reviewee_id, reviewer_id)
);
```
- 🔲 Add `peer_review_assignments` model to `schema.prisma`
- 🔲 Run migration

#### Alter `performance_reviews` — add cycle and review type
```sql
ALTER TABLE performance_reviews
  ADD COLUMN cycle_id     VARCHAR(36) NULL AFTER reviewPeriod,
  ADD COLUMN review_type  ENUM('self_review','peer_review','manager_appraisal') NOT NULL DEFAULT 'self_review' AFTER cycle_id,
  ADD COLUMN reviewee_id  VARCHAR(36) NULL AFTER review_type,  -- for peer_review: who is being reviewed
  ADD CONSTRAINT fk_pr_cycle    FOREIGN KEY (cycle_id)    REFERENCES review_cycles(id),
  ADD CONSTRAINT fk_pr_reviewee FOREIGN KEY (reviewee_id) REFERENCES users(id);
```
- 🔲 Update `performance_reviews` in `schema.prisma`
- 🔲 Update `performance_review_status` enum — add `peer_review_pending`, `peer_reviews_in_progress`, `peer_reviews_complete`
- 🔲 Run migration

#### Alter `review_questions` — add weight and subcategory
Required to support the weighted scoring system (e.g. "Task Delivery on Time = 15%") from the Manager Appraisal sheet.
```sql
ALTER TABLE review_questions
  ADD COLUMN subcategory   VARCHAR(100) NULL AFTER category,
  ADD COLUMN weight        DECIMAL(5,2) NULL AFTER subcategory,  -- percentage weight for scoring
  ADD COLUMN review_type   ENUM('self_review','peer_review','manager_appraisal','next_steps') NOT NULL DEFAULT 'self_review' AFTER phase,
  ADD COLUMN guidance_text TEXT NULL AFTER questionText;         -- the "Notes" / example column from Excel
```
- 🔲 Update `review_questions` in `schema.prisma`
- 🔲 Run migration
- 🔲 Seed questions from the Excel sheets (see §3.3 below)

#### Alter `review_responses` — support decimal ratings and weighted score
```sql
ALTER TABLE review_responses
  ADD COLUMN rating_decimal   DECIMAL(3,2) NULL AFTER ratingResponse,  -- computed: weight × rating / 5
  ADD COLUMN reviewer_type    ENUM('self','peer','manager') NOT NULL DEFAULT 'self' AFTER reviewer_id;
```
- 🔲 Update `review_responses` in `schema.prisma`
- 🔲 Run migration

---

### 3.3 Seed Data — Questions

Seed all questions from the Excel sheets into `review_questions`. The existing table supports this; it just needs data.

#### Manager Appraisal questions (review_type = `manager_appraisal`)
| Category | Subcategory | Weight |
|---|---|---|
| Technical Competence | Task Delivery on Time | 15% |
| Technical Competence | Quality of Work (Rework Required) | 10% |
| Technical Competence | Problem Solving / Innovation | 15% |
| Delivery & Reliability | Dependability | 10% |
| Delivery & Reliability | Task Prioritization | 10% |
| Delivery & Reliability | Documentation / Automation Contribution | 10% |
| Collaboration & Soft Skills | Communication | 10% |
| Collaboration & Soft Skills | Team Support / Mentoring | 10% |
| Growth & Initiative | Initiative / Improvement Suggestions | 5% |
| Growth & Initiative | Learning / Skill Development | 5% |

- 🔲 Write seed script `backend/prisma/seed-review-questions.ts`

#### Peer Review questions (review_type = `peer_review`)
Categories: Reliability and Delivery, Collaboration and Support, Contribution to Infrastructure, Leadership in Complex Projects, Security Practices, AWS Expertise, Openness to Feedback, Engineering Efficiency, Mentorship.
- 🔲 Include guidance text (the description column from the Peer Review sheet)

#### Self-Review questions (review_type = `self_review`)
Categories: Technical Contribution, Leadership in Projects, Learning and Application, Process and Automation, DevOps/AWS, Time Delivery, Strengths, Improvement Area, Team Contributions.
- 🔲 Include examples column as `guidance_text`

#### Next Steps questions (review_type = `next_steps`)
- "What do you want to learn or achieve in the next quarter?"
- "What kind of support or resources would help you be more effective?"

---

### 3.4 Backend — API Routes

The existing `backend/lambda/routes/performance.ts` has some routes but they do not support the cycle-based peer nomination flow. The file needs to be restructured.

#### Cycle management (admin/HR only)
- 🔲 `POST /api/performance/cycles` — create a new review cycle (name, start_date, end_date)
- 🔲 `POST /api/performance/cycles/:id/activate` — set cycle to `active`; randomly assign 3 peers per employee (exclude direct reports, exclude self); create `peer_review_assignments` rows; send notifications
- 🔲 `GET /api/performance/cycles` — list all cycles with status and completion stats
- 🔲 `POST /api/performance/cycles/:id/close` — set cycle to `closed`; compute aggregate scores

#### Peer assignment (random nomination logic)
```
For each active employee E:
  candidates = all active employees EXCLUDING E and E's direct reports
  randomly pick 3 from candidates (shuffle + slice)
  INSERT into peer_review_assignments (cycle_id, reviewee_id, reviewer_id)
```
- 🔲 Implement randomisation in cycle activate endpoint
- 🔲 Handle edge case: fewer than 3 eligible peers (e.g. very small team — assign however many are available)

#### Employee endpoints
- 🔲 `GET /api/performance/my-reviews` — returns the current user's self-review and peer reviews they need to complete
- 🔲 `GET /api/performance/my-self-review/:cycleId` — get or create self-review record for current cycle
- 🔲 `GET /api/performance/my-peer-assignments` — list of engineers the current user needs to peer-review this cycle
- 🔲 `POST /api/performance/responses` — save a response (self or peer); upsert by `(performanceReviewId, questionId)`
- 🔲 `POST /api/performance/reviews/:id/submit` — mark self-review or peer review as complete

#### Manager endpoints
- 🔲 `GET /api/performance/team-reviews/:cycleId` — list all employees in manager's team with their review status
- 🔲 `GET /api/performance/reviews/:employeeId/:cycleId` — full review data for one employee (self-review answers, aggregated peer scores, space for manager appraisal)
- 🔲 `POST /api/performance/manager-appraisal` — save manager appraisal ratings (weighted score calculated server-side)
- 🔲 `POST /api/performance/next-steps` — save next-steps notes

#### HR/Admin endpoints
- 🔲 `GET /api/performance/hr-summary/:cycleId` — all employees, all scores (self + peer avg + manager appraisal), sortable
- 🔲 `GET /api/performance/hr-review/:employeeId/:cycleId` — full breakdown for one employee visible to HR

---

### 3.5 Frontend ✅ Complete

All pages are built against a mock store. Pending items are **API wiring only** (see `PERFORMANCE_REVIEW_INTEGRATION.md` Phase 4).

#### Routing & navigation
- ✅ `Sidebar.tsx` — "Performance Reviews" nav item under Workspace (all users) and Administration (admin)
- ✅ Routes registered in `App.tsx`:
  - `/performance-review` → `PerformanceReviewEmployee` (employee dashboard)
  - `/performance-review/peer/:employeeId` → `PerformanceReviewPeerPage`
  - `/performance-review-admin` → `PerformanceReviewAdmin` (admin cycle management)
  - `/performance-review-admin/submissions/:employeeId` → `PerformanceReviewSubmissionsPage`

#### Employee views
- ✅ **My Reviews dashboard** — current cycle status, self-review progress, assigned peer reviews list
- ✅ **Self-review form** — all questions grouped by category, 1–5 rating scale, text fields, submit locks form
- ✅ **Peer review form** — per-reviewee page with feedback + notes fields, submit guards all questions answered

#### Manager / Admin views
- ✅ **Admin cycle management** — stats cards, employee list with scores, create cycle dialog, nominate peers dialog, manager appraisal dialog
- ✅ **Submissions review** — tabbed view (Manager / Peers / Self), aggregated peer scores, per-reviewer breakdowns, manager calibration overrides with notes, score pills

#### Shared components
- ✅ `RatingScale` — 1–5 interactive rating component (`frontend/src/components/RatingScale.tsx`)
- ✅ `StatsCard` — reusable stat card with hover blob animation (`frontend/src/components/ui/StatsCard.tsx`)

#### Pending (API wiring)
- 🔲 Replace `performanceStore` mock with real API calls — tracked in `PERFORMANCE_REVIEW_INTEGRATION.md` Phase 4

---

### 3.6 Notifications
- 🔲 Notify employee when a new review cycle is activated (self-review now open)
- 🔲 Notify peer reviewers when they are assigned (peer review now open)
- 🔲 Remind employees 3 days before cycle end date if self-review is incomplete
- 🔲 Notify manager when all peer reviews for an employee are complete (ready to do manager appraisal)
- 🔲 Notify employee when manager has completed appraisal (results available)

---

---

## 4. Leave Request Automation

**Goal:** Reduce admin overhead by (a) automatically reminding admins when a leave request has been sitting `pending` for more than 7 days, and (b) auto-expiring pending requests whose leave dates have already passed without a decision.

---

### 4.1 Stale-Request Admin Reminders

When a leave request is submitted and not actioned within 7 days, all admin/management users receive an automated email nudge. A 24-hour cooldown per request prevents daily flooding.

#### Database
- 🔲 Create table `leave_reminder_log`:
  ```sql
  CREATE TABLE leave_reminder_log (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    leave_id   INT NOT NULL,
    sent_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_leave_id (leave_id),
    FOREIGN KEY (leave_id) REFERENCES leave_requests(id) ON DELETE CASCADE
  );
  ```
  Used to enforce the 24-hour per-request cooldown (same pattern as `document_reminders`).

#### Backend
- 🔲 Create `backend/lambda/scheduled/leaveReminderScheduler.ts`
  - EventBridge-triggered, runs Mon–Fri at 8 AM UTC (same cadence as document reminders)
  - Query: `leave_requests WHERE status = 'pending' AND createdAt < NOW() - INTERVAL 7 DAY`
  - Join with `leave_reminder_log` to filter out requests reminded in the last 24 hours
  - Send via `senderManagement()` (already wired to management/admin email addresses in `emailMiddleware.ts`)
  - After each successful send, insert a row into `leave_reminder_log`
  - Email body: employee name, leave type, duration, dates, how many days pending, link to approve-leave page
- 🔲 Register the new Lambda + EventBridge rule in CDK (same pattern as `documentReminderScheduler`)

#### Frontend
- 🔲 No frontend changes required — admins see the email and click through to the existing `/approve-leave` page

---

### 4.2 Auto-Expiry of Stale Pending Requests

When a leave request is still `pending` after its `start_date` has passed, it is automatically moved to `expired` status. The employee is notified so they know to resubmit if needed.

#### Database
- 🔲 Add `'expired'` to the `status` column — if `status` is a DB `ENUM`, run:
  ```sql
  ALTER TABLE leave_requests
    MODIFY COLUMN status ENUM('pending','approved','rejected','cancelled','expired') NOT NULL DEFAULT 'pending';
  ```
  If it is a plain `VARCHAR`, no migration is needed.
- 🔲 Update `LeaveStatus` type in `backend/lambda/helpers/leaveHelpers.ts`:
  ```ts
  export type LeaveStatus = 'approved' | 'rejected' | 'pending' | 'cancelled' | 'expired';
  ```

#### Backend
- 🔲 Add `leaveExpiryHandler` to `leaveReminderScheduler.ts` (or a separate `leaveExpiryScheduler.ts`)
  - Runs daily (can share the same EventBridge rule as the reminder scheduler)
  - Query: `leave_requests WHERE status = 'pending' AND start_date < CURDATE()`
  - For each result:
    1. `UPDATE leave_requests SET status = 'expired', system_notes = CONCAT(system_notes, ' | Auto-expired: leave dates passed without approval'), updatedAt = NOW() WHERE id = ?`
    2. `INSERT INTO leave_action_log (leave_id, manager_id, action, previous_status, new_status, timestamp) VALUES (?, NULL, 'auto_expired', 'pending', 'expired', NOW())`
    3. Email employee via `sender()` — subject "Your leave request has expired", body explaining the request lapsed and they can resubmit
  - Process requests individually so one failure does not block the rest

#### Frontend
- 🔲 Add `'expired'` to the status badge/styling in `ApplyLeavePage.tsx` and `LeaveHistoryPage.tsx`
  - Suggested style: grey badge, label "Expired", icon `ClockX` or `Ban`
- 🔲 Add `'expired'` to the status filter `<Select>` on `LeaveHistoryPage.tsx` so employees can filter for their expired requests

---

---

## 5. SimplePay Payslip Integration

**Goal:** Employees can view and download their payslips from SimplePay directly inside the LMS. Access is gated behind a one-time OTP sent to their registered email address for each session — since SimplePay uses a single org-level API key, the OTP layer is our own identity gate built inside the LMS backend.

**SimplePay API base URL:** `https://api.payroll.simplepay.cloud/v1/`
**Auth:** `Authorization: <api_key>` header on every request.
**Key endpoints used:**
- `GET /v1/clients/:client_id/employees?include=recent_payslips` — initial employee lookup / sync
- `GET /v1/employees/:employee_id/payslips` — list payslips for a specific employee
- `GET /v1/payslips/:payslip_id` — payslip detail (period, gross, net, deductions)
- `GET /v1/payslips/:payslip_id.pdf` — download PDF (streamed through Lambda, never exposed to the client directly)

**The SimplePay API key never touches the frontend.** All calls are proxied through the LMS Lambda.

---

### 5.1 OTP Flow — How It Works

```
1. User navigates to /payslips
2. LMS backend generates a 6-digit OTP
3. OTP is hashed (SHA-256) and stored in payslip_otp_sessions with a 5-minute expiry
4. Raw OTP is emailed to the user's registered email via AWS SES (already configured)
5. User enters OTP in the modal
6. Backend verifies hash + expiry → marks session as verified (30-minute window)
7. User can now list and download their payslips for that session
8. Session expires → OTP gate shown again on next visit
```

Rate limit: max 3 OTP requests per user per hour (enforced in the route handler using the `payslip_otp_sessions` table).

---

### 5.2 Database

#### New table — `payslip_otp_sessions`
Stores OTP verification state. The raw OTP is never persisted — only its SHA-256 hash.
```sql
CREATE TABLE payslip_otp_sessions (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      VARCHAR(36) NOT NULL,
  otp_hash     VARCHAR(64) NOT NULL,       -- SHA-256 of the 6-digit OTP
  expires_at   TIMESTAMP NOT NULL,         -- now + 5 minutes (OTP validity)
  verified_at  TIMESTAMP NULL,             -- set when OTP is successfully verified
  session_expires_at TIMESTAMP NULL,       -- now + 30 minutes (post-verify window)
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Alter `users` — add SimplePay employee ID
```sql
ALTER TABLE users
  ADD COLUMN simplepay_employee_id VARCHAR(50) NULL AFTER id;
```
This maps each LMS user to their SimplePay employee record. Populated either:
- **Auto-sync** (recommended): when the payslips feature is enabled, a one-off Lambda syncs SimplePay employees by email against the `users` table.
- **Manual**: admin sets `simplepay_employee_id` via the Manage Employees page.

- 🔲 Add `simplepay_employee_id` column to `users` in `schema.prisma`
- 🔲 Run migration
- 🔲 Create `payslip_otp_sessions` table in `schema.prisma`
- 🔲 Run migration

---

### 5.3 Backend

#### New integration — `backend/lambda/integrations/simplePay.ts`
Wraps all SimplePay API calls. Retrieves the API key from AWS Secrets Manager (same pattern as `outlookCalendar.ts`).
- 🔲 `getSimplePayApiKey()` — reads `SIMPLEPAY_API_KEY_SECRET_NAME` from env, calls Secrets Manager
- 🔲 `getEmployeePayslips(simplpayEmployeeId: string)` → `PayslipSummary[]`
- 🔲 `getPayslipDetail(payslipId: string)` → `PayslipDetail`
- 🔲 `getPayslipPdfBuffer(payslipId: string)` → `Buffer` (to stream to client)
- 🔲 `syncEmployeeByEmail(email: string)` → `string | null` (returns SimplePay employee ID or null if no match)

#### New route file — `backend/lambda/routes/payslips.ts` mounted at `/payslips`
All routes require a valid Cognito JWT (existing `authMiddleware`).

| Method | Path | Description |
|---|---|---|
| `POST` | `/payslips/request-otp` | Generate OTP, hash + store in `payslip_otp_sessions`, email to user. Enforce 3/hour rate limit. |
| `POST` | `/payslips/verify-otp` | Compare hash, check expiry. On success set `verified_at` + `session_expires_at`. Return `{ verified: true }`. |
| `GET` | `/payslips` | Require verified OTP session. Look up user's `simplepay_employee_id`. Proxy `GET /employees/:id/payslips` to SimplePay. Return list. |
| `GET` | `/payslips/:id` | Require verified OTP session. Proxy `GET /payslips/:id` to SimplePay. Return detail. |
| `GET` | `/payslips/:id/pdf` | Require verified OTP session. Proxy `GET /payslips/:id.pdf`, stream the binary back with `Content-Type: application/pdf`. |

- 🔲 Implement all five routes in `payslips.ts`
- 🔲 Register `/payslips` in `backend/lambda/index.ts`
- 🔲 Add `SIMPLEPAY_API_KEY_SECRET_NAME` and `SIMPLEPAY_CLIENT_ID` to `backend/.env` and AWS Secrets Manager

#### New email function — OTP email
`sender()` in `emailMiddleware.ts` is typed to `LeaveStatus` and uses the leave email template. Create a standalone function:
- 🔲 Add `senderOtp(recipientEmail: string, name: string, otp: string): Promise<void>` to `emailMiddleware.ts`
  - Simple transactional email — no complex template needed
  - Subject: `"Your LMS payslip access code"`
  - Body: `"Your one-time code is: <strong>123456</strong>. It expires in 5 minutes."`

#### Employee sync utility — `backend/lambda/scripts/syncSimplePayEmployees.ts`
One-off script (run manually or as a Lambda) that matches SimplePay employees to LMS users by email and populates `simplepay_employee_id`.
- 🔲 `GET /v1/clients/:client_id/employees` → iterate, match by `email` against `users` table, `UPDATE users SET simplepay_employee_id = ? WHERE email = ?`
- 🔲 Log unmatched SimplePay employees so admin can manually resolve

---

### 5.4 Frontend

#### Feature flag
- 🔲 Add `VITE_FEATURE_PAYSLIPS=true` to `frontend/.env` (dev)
- 🔲 Add `VITE_FEATURE_PAYSLIPS=false` to `frontend/.env.production` (disabled in prod until ready)
- 🔲 Add `payslips` key to `frontend/src/config/features.ts`
- 🔲 Gate route and sidebar item behind `features.payslips`

#### New page — `frontend/src/pages/PayslipsPage.tsx`
- 🔲 On mount: check for an active verified OTP session (store `session_expires_at` in `sessionStorage`)
- 🔲 If no session: show `OtpGateModal` (see below) before rendering anything else
- 🔲 Payslip list — card or table layout showing: pay period, pay date, gross pay, net pay, download button
- 🔲 Download button calls `GET /payslips/:id/pdf` and opens the PDF in the existing `DocumentViewer` component
- 🔲 "Refresh access" button (re-triggers OTP) shown when session is close to expiry

#### New component — `frontend/src/components/OtpGateModal.tsx`
- 🔲 Step 1 — "Send code" screen: user sees their masked email (`g***@disraptor.co.za`), presses "Send my code" → calls `POST /payslips/request-otp`
- 🔲 Step 2 — "Enter code" screen: 6-box OTP input (one digit per box, auto-advance), countdown timer showing expiry, "Resend" link (disabled for 60s), Submit button
- 🔲 On success: store `session_expires_at` in `sessionStorage`, close modal, load payslips
- 🔲 On failure: show error inline, allow retry up to rate limit

#### Routing & navigation
- 🔲 Add route `/payslips` in `App.tsx` behind `features.payslips` flag (same pattern as document routes)
- 🔲 Add "My Payslips" nav item under **Workspace** in `Sidebar.tsx` behind `features.payslips` flag (icon: `Receipt` from lucide-react)

---

### 5.5 Security Considerations

| Risk | Mitigation |
|---|---|
| API key exposure | Key stored only in AWS Secrets Manager, read at Lambda cold-start. Never in env vars, never in any response. |
| Employee spoofing | `simplepay_employee_id` is looked up server-side from the authenticated user's own DB record — never accepted from the client. |
| OTP brute force | 3 requests/hour rate limit + 5-minute expiry + hash storage (raw OTP never persisted). |
| Session replay | `session_expires_at` enforced server-side on every payslip request — client-side `sessionStorage` is convenience only. |
| PDF leakage | PDF is streamed through Lambda with the user's JWT validated. No pre-signed S3 URLs or direct SimplePay URLs are ever sent to the browser. |

---

### 5.6 Admin — Manage Employees Enhancement
- 🔲 Add "SimplePay ID" column to the Manage Employees table (read-only, shows sync status: linked / unlinked)
- 🔲 Admin can manually set `simplepay_employee_id` for unmatched employees via an edit field
- 🔲 "Sync from SimplePay" button triggers the employee sync Lambda

---

## Summary — Pending DB migrations

| Migration | Urgency |
|---|---|
| `ALTER TABLE leave_requests ADD outlook_shared_event_id, outlook_personal_event_id` | ✅ Done — columns exist in schema.prisma and DB |
| `CREATE TABLE review_cycles` | Required for Performance Reviews |
| `CREATE TABLE peer_review_assignments` | Required for Performance Reviews |
| `ALTER TABLE performance_reviews ADD cycle_id, review_type, reviewee_id` | Required for Performance Reviews |
| `ALTER TABLE review_questions ADD subcategory, weight, review_type, guidance_text` | Required for Performance Reviews |
| `ALTER TABLE review_responses ADD rating_decimal, reviewer_type` | Required for Performance Reviews |
| `CREATE TABLE leave_reminder_log` | Required for Leave Automation §4.1 |
| `ALTER TABLE leave_requests MODIFY status ENUM (add 'expired')` | Required for Leave Automation §4.2 |
| `CREATE TABLE payslip_otp_sessions` | Required for SimplePay Integration §5.2 |
| `ALTER TABLE users ADD simplepay_employee_id` | Required for SimplePay Integration §5.2 |
