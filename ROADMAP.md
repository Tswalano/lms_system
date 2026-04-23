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

## 3. Performance Reviews

**Goal:** A structured quarterly review cycle where each engineer completes a self-review, is rated by their manager, and receives anonymous peer feedback from 3 randomly assigned colleagues. HR can see the aggregated scores. Mirrors the existing Excel appraisal format.

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

### 3.5 Frontend

The existing pages under `frontend/src/pages/performance-review/` were built for the old flow and are **broken**. They need to be rewritten against the new API.

#### Routing & navigation
- 🔲 Add "Performance Reviews" nav item under **Workspace** in `Sidebar.tsx` (visible to all)
- 🔲 Add "Performance Reviews" nav item under **Administration** in `Sidebar.tsx` (HR/admin view)
- 🔲 Register routes in `App.tsx`:
  - `/performance` → employee dashboard
  - `/performance/self-review/:cycleId` → self-review form
  - `/performance/peer-review/:assignmentId` → peer review form
  - `/admin/performance` → HR/admin cycle management
  - `/admin/performance/:cycleId` → HR summary for a cycle
  - `/admin/performance/:cycleId/:employeeId` → HR full review for one employee

#### Employee views
- 🔲 **My Reviews dashboard** — shows current cycle, self-review status, pending peer reviews to complete
- 🔲 **Self-review form** — renders questions grouped by category with rating sliders (1–5) and text areas; guidance text shown as helper; progress saved on each answer; submit button locks form
- 🔲 **Peer review form** — same structure as self-review but for the reviewee; shows reviewee's name and role; anonymous (reviewer name not stored on the response visible to reviewee)

#### Manager views
- 🔲 **Team review list** — table of direct reports with their review completion status per cycle
- 🔲 **Employee review detail** — side-by-side view: self-review answers on left, manager appraisal form on right; shows aggregated peer scores section; weighted score calculated live as manager fills ratings
- 🔲 **Next Steps form** — text fields for Q+A from the Next Steps sheet; attached to the review record

#### HR/Admin views
- 🔲 **Cycle management page** — create cycle, activate (triggers random assignments), view progress, close cycle
- 🔲 **HR summary table** — all employees in the cycle, columns: Self Score, Peer Avg Score, Manager Score, Overall Weighted Score; sortable and exportable to CSV
- 🔲 **HR individual review** — same as manager view but read-only, shows all three review types

#### Shared components
- 🔲 `RatingInput` — 1–5 star or slider component with the rating scale (1=Needs Improvement … 5=Exceptional)
- 🔲 `WeightedScoreBar` — visual progress bar showing score against weight (for manager appraisal)
- 🔲 `ReviewStatusBadge` — shows not started / in progress / completed / missed

---

### 3.6 Notifications
- 🔲 Notify employee when a new review cycle is activated (self-review now open)
- 🔲 Notify peer reviewers when they are assigned (peer review now open)
- 🔲 Remind employees 3 days before cycle end date if self-review is incomplete
- 🔲 Notify manager when all peer reviews for an employee are complete (ready to do manager appraisal)
- 🔲 Notify employee when manager has completed appraisal (results available)

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
