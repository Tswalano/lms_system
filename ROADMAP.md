# LMS Application — Feature Roadmap

> Status legend: ✅ Done · 🔲 Pending · 🚧 In Progress · ⚠️ Blocked

---

## Completed Features (summary)

| Feature | Status |
|---|---|
| Outlook Calendar Integration (OOF events on approval/cancellation) | ✅ Complete |
| Bulk Leave Approvals | ✅ Complete |
| Performance Reviews (all frontend pages + API wiring) | ✅ Complete |
| Employee & Admin Document Management | ✅ Complete |
| In-App Notification System | ✅ Complete |
| Leave History & Filtering | ✅ Complete |
| Team Availability Calendar | ✅ Complete |
| Manage Employees & Departments | ✅ Complete |
| User Profile & Password Management | ✅ Complete |

> Two manual infra items from the Outlook integration remain outstanding:
> - 🔲 M365 Admin: create shared mailbox `leave-calendar@disraptor.co.za` and grant org-wide Read access to its calendar
> - 🔲 AWS Secrets Manager: add `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` into the `lmsDevelopment` secret for the production Lambda

---

## 1. Document Signature Feature — Gaps & Improvements

**Current state:** Employees can view documents and click a confirm button that records `acknowledgement_checked: true`. This is a simple boolean flag — there is no real signature, no audit trail, and no compliance-grade record.

---

### 1.1 Real Digital Signature Capture 🔲

The current modal just shows a confirm button. A proper e-signature flow requires capturing something the employee actively provides.

#### Backend
- 🔲 Add `signature_data TEXT NULL` column to the signatures table (stores base64 or typed-name string)
- 🔲 Add `signed_at TIMESTAMP`, `ip_address VARCHAR(45)`, `user_agent TEXT` columns to signatures table for audit evidence
- 🔲 `PUT /user-docs/document-completion` — accept and persist `signatureData`, `ipAddress`, `userAgent` alongside the existing `acknowledgement_checked`

#### Frontend
- 🔲 Replace the confirm-button modal with a two-step signature modal:
  - **Step 1 — Read & confirm:** checkbox "I have read and understood this document"
  - **Step 2 — Sign:** choose method:
    - *Type your name* — renders typed name in a signature font
    - *Draw* — canvas pad using a lightweight lib (e.g. `signature_pad`)
  - Preview of the captured signature before submitting
- 🔲 Capture `ip_address` and `user_agent` client-side and send alongside signature payload
- 🔲 Show the captured signature image/name in the admin "View Signatures" modal alongside each employee's record

---

### 1.2 Document Progress Tracking 🔲

**Current state:** `document-progress` API call sends random placeholder values for `page`, `scrollPercentage`, and `timeSpent`. There is a `TODO` comment in `EmployeeDocumentsPage.tsx` flagging this.

#### Frontend
- 🔲 Track real scroll position within the `DocumentViewer` iframe using `postMessage` (PDF.js supports this) or a wrapper `scroll` event listener on the container
- 🔲 Track time-on-page using a `useEffect` timer that starts when the viewer opens and clears on close
- 🔲 Track current page number for PDF files (PDF.js page change events)
- 🔲 Send real values to `POST /user-docs/document-progress` instead of random numbers

---

### 1.3 Document Versioning 🔲

When an admin updates a document (new file upload), existing employee signatures become stale and employees should re-sign.

#### Backend
- 🔲 Add `version INT DEFAULT 1` to the documents table
- 🔲 On `PUT /admin-docs/{docId}` with a new file: increment version, reset all related signatures to `pending`, insert audit log entry
- 🔲 Store `signature_version INT` on the signatures table so a signature is only valid for the document version it was signed against

#### Frontend
- 🔲 Show a "Version updated — re-signature required" banner on documents in the employee view
- 🔲 Show the version number and last-updated date in the admin document table

---

### 1.4 Document Assignment Automation 🔲

Currently documents must be manually assigned. There is no automatic assignment when a new employee joins a department.

#### Backend
- 🔲 `POST /admin-docs/{docId}/assign-department` — assign a document to all current members of a department
- 🔲 Hook into the employee creation flow: when a new user is created and assigned a department, automatically assign that department's active documents to them

#### Frontend
- 🔲 "Assign to Department" button in the admin document edit modal (replaces or supplements the current individual assignment flow)

---

### 1.5 Document Expiry & Renewal 🔲

Policies and compliance documents typically expire and require annual re-acknowledgement.

#### Backend
- 🔲 Add `expires_at DATE NULL` and `renewal_period_days INT NULL` columns to the documents table
- 🔲 Scheduled job: 14 days before `expires_at`, reset employee signatures to `pending` and notify employees
- 🔲 Scheduled job: on `expires_at`, mark any still-signed records as `overdue`

#### Frontend
- 🔲 Expiry date picker in the AddDocument/EditDocument modals
- 🔲 "Expires in X days" badge on the admin document table
- 🔲 "Re-acknowledgement required" status in the employee document list

---

### 1.6 Audit Trail Page (Admin) 🔲

Admins currently have no log of when documents were signed, reminders sent, or versions changed.

#### Backend
- 🔲 Create `document_audit_log` table: `(id, document_id, user_id, action ENUM('signed','viewed','reminded','version_updated','assigned','unassigned'), performed_at, metadata JSON)`
- 🔲 Write to audit log on every signature, reminder send, and version update
- 🔲 `GET /admin-docs/{docId}/audit-log` — paginated log for one document

#### Frontend
- 🔲 "Audit Log" tab in the admin View Signatures modal
- 🔲 Shows timestamped rows: action, user, date — sortable and filterable

---

## 2. Performance Review Feature — Gaps & Improvements

**Current state:** All six frontend pages are built and wired to real API endpoints. Cycle management (create → activate → close), employee self-review, peer review, manager appraisal, submissions overview with score overrides, and CSV export all work. The following items are outstanding.

---

### 2.1 Scheduled Cycle-End Reminder 🔲

The only remaining backend task from the original feature.

#### Backend
- 🔲 EventBridge rule: runs daily
- 🔲 Handler: query `review_cycles WHERE status = 'active' AND end_date = CURDATE() + INTERVAL 3 DAY`
- 🔲 For each such cycle: find employees whose self-review `status != 'submitted'`
- 🔲 Send in-app notification + SES email: "Your self-review for [Cycle Name] is due in 3 days"
- 🔲 Register new EventBridge rule and handler in CDK (same pattern as `documentReminderScheduler`)

---

### 2.2 Submission Deadline Enforcement 🔲

Currently employees can submit reviews even after the cycle's `end_date`. The UI does not communicate deadlines or block late submissions.

#### Backend
- 🔲 `POST /performance/responses` and `POST /performance/reviews/{id}/submit` — return `403` with a clear message if `cycle.status === 'closed'` or `cycle.end_date < today`

#### Frontend
- 🔲 Show the cycle end date prominently on the employee self-review page
- 🔲 Show a countdown badge (e.g. "3 days left") when fewer than 7 days remain
- 🔲 Disable the submit button and show a "Cycle closed — submission period has ended" message once the deadline passes

---

### 2.3 Employee Access to Their Own Results 🔲

Employees currently have no way to see their final scores or manager feedback after a cycle closes. Results only exist in the admin submissions page.

#### Backend
- 🔲 `GET /performance/my-results/:cycleId` — returns the employee's final weighted score, manager ratings by category, and anonymised peer averages (never expose individual peer identities to the employee)

#### Frontend
- 🔲 Add a "Past Results" section to `PerformanceReviewEmployeePage` that appears when a cycle is closed
- 🔲 Show: overall weighted score, manager score breakdown by category, anonymised peer average per category
- 🔲 Do NOT show individual peer reviewer scores or identities

---

### 2.4 Manager Delegation 🔲

If the assigned manager is unavailable, there is no way to delegate the appraisal to another admin.

#### Backend
- 🔲 Add `delegated_to VARCHAR(36) NULL REFERENCES users(id)` to the manager review record
- 🔲 `PUT /performance/appraisals/{reviewId}/delegate` — admin can reassign the appraiser

#### Frontend
- 🔲 "Delegate Appraiser" button in the admin submissions page, opens a user-picker modal
- 🔲 Show delegated-from info on the manager appraisal page so the delegate knows context

---

### 2.5 Review Cycle Dashboard Stats 🔲

The admin page shows four stat cards but they do not break down completion rates by review type (self vs peer vs manager).

#### Frontend
- 🔲 Expand the stats section on `PerformanceReviewAdminPage` to include:
  - Self-reviews submitted / total
  - Peer reviews completed / total assignments
  - Manager appraisals completed / total
  - Average final score across the cycle (when available)

---

### 2.6 Peer Review Anonymity Enforcement 🔲

The admin submissions page currently shows each peer reviewer's name and individual breakdown. Employees cannot currently see these, but there is no backend enforcement preventing a frontend change from accidentally exposing them.

#### Backend
- 🔲 `GET /performance/submissions/{employeeId}` — add a `role` check: if the requester is the employee being reviewed (not an admin/manager), anonymise reviewer identities in the response and aggregate peer scores

---

## 3. Leave Request Automation 🔲

**Goal:** Reduce admin overhead by (a) reminding admins when a leave request has been pending for more than 7 days, and (b) auto-expiring pending requests whose leave start date has passed without a decision.

### 3.1 Stale-Request Admin Reminders

#### Database
- 🔲 Create `leave_reminder_log (id, leave_id, sent_at)` table with a 24-hour cooldown per request (same pattern as `document_reminders`)

#### Backend
- 🔲 Create `backend/lambda/scheduled/leaveReminderScheduler.ts`
  - EventBridge-triggered, Mon–Fri at 8 AM UTC
  - Query: `leave_requests WHERE status = 'pending' AND createdAt < NOW() - INTERVAL 7 DAY`
  - Filter out requests reminded in the last 24 hours via `leave_reminder_log`
  - Email: employee name, leave type, duration, dates, days pending, link to `/approve-leave`
  - Insert row into `leave_reminder_log` after each send
- 🔲 Register Lambda + EventBridge rule in CDK

### 3.2 Auto-Expiry of Stale Pending Requests

#### Database
- 🔲 `ALTER TABLE leave_requests MODIFY COLUMN status ENUM('pending','approved','rejected','cancelled','expired')`
- 🔲 Add `LeaveStatus = 'expired'` to `backend/lambda/helpers/leaveHelpers.ts`

#### Backend
- 🔲 Add `leaveExpiryHandler` to the scheduler (shares the same EventBridge rule)
  - Query: `leave_requests WHERE status = 'pending' AND start_date < CURDATE()`
  - Update status to `expired`, append to `system_notes`, insert into `leave_action_log`
  - Email employee: "Your leave request has expired — resubmit if still needed"

#### Frontend
- 🔲 Add `'expired'` status badge (grey, `ClockX` icon) to `LeaveHistoryPage`
- 🔲 Add `'expired'` to the status filter `<Select>` on `LeaveHistoryPage`
- 🔲 `ApproveLeavePage` — expired requests should not appear in the pending queue

---

## 4. Reporting & Analytics 🔲

**Goal:** Give HR and admins visibility into leave trends, department coverage, and org-wide patterns without exporting to Excel.

### Backend
- 🔲 New route file `backend/lambda/routes/reports.ts` mounted at `/api/reports`
- 🔲 `GET /api/reports/leave-summary` — total leave days per employee per leave type for a given period
- 🔲 `GET /api/reports/department-coverage` — employees on leave per date per department (coverage gaps)
- 🔲 `GET /api/reports/peak-periods` — leave volume grouped by month/week
- 🔲 `GET /api/reports/leave-type-breakdown` — org-wide split by leave type as percentages
- 🔲 Register `/api/reports` in the main Lambda handler

### Frontend
- 🔲 New page `frontend/src/pages/ReportsPage.tsx`
- 🔲 Add "Reports" nav item under **Administration** in `Sidebar.tsx`
- 🔲 Add route `/reports` in `App.tsx` (admin-only)
- 🔲 Summary stat cards: total leave days this year, avg days per employee, most common leave type
- 🔲 Bar chart — leave days per department (`recharts`)
- 🔲 Line chart — leave requests over time (monthly trend)
- 🔲 Sortable table — individual employee leave summary
- 🔲 Date range filter: current quarter / current year / custom
- 🔲 CSV export for the summary table

---

## 5. Leave Balance Management 🔲

**Goal:** Give admins the ability to view and manually adjust individual employee leave balances (top-ups, carry-overs, corrections).

### Backend
- 🔲 `GET /leave/balances` — return all employees with their current balance per leave type
- 🔲 `POST /leave/balances/adjust` — admin adjusts a balance: `{ userId, leaveType, adjustment, reason }`
- 🔲 Create `leave_balance_log (id, user_id, leave_type, previous_balance, adjustment, new_balance, reason, adjusted_by, adjusted_at)` for audit

### Frontend
- 🔲 New tab or modal on `ManageEmployeesPage` — "Leave Balances" section per employee
- 🔲 Inline editable balance fields with an adjustment reason input
- 🔲 Show balance log history per employee (collapsed by default)

---

## 6. Notification System Refactor 🔲

**Goal:** Replace MySQL triggers with a testable, observable Node.js event-driven notification service.

> Current state: Notifications are generated via MySQL triggers (hard to debug, no logs, tight DB coupling).

### Backend
- 🔲 Create `backend/services/events.ts` — `emitEvent(event: NotificationEvent)` (in-memory initially)
- 🔲 Create `backend/services/notificationService.ts` — resolve recipients, build messages, insert into `notifications` table
- 🔲 Create per-domain handlers: `leaveHandlers.ts`, `documentHandlers.ts`, `performanceHandlers.ts`

### Migration Plan
1. 🔲 Implement event system alongside existing triggers (double-write)
2. 🔲 Validate parity: every trigger-generated notification must have an equivalent event-generated one
3. 🔲 Remove DB triggers once parity is confirmed
4. 🔲 Unit + integration tests per handler

### Future (Phase 2)
- 🔲 Replace in-memory emitter with AWS SQS or EventBridge
- 🔲 Worker Lambda that consumes events and processes notifications asynchronously
- 🔲 Email (SES), Slack/Teams, and push notification channels

---

## 7. Onboarding Workflow 🔲

**Goal:** When a new employee is added, automatically kick off a structured onboarding checklist — document signing, handbook reading, and welcome notifications — without manual admin intervention.

### Backend
- 🔲 Create `onboarding_templates` table: ordered list of tasks (document IDs, links, free-text instructions) that apply to all new employees or by department
- 🔲 On `POST /users/add-user`: trigger onboarding flow — assign all required documents, send welcome notification, create checklist record
- 🔲 `GET /onboarding/status/:userId` — completion percentage across all onboarding tasks

### Frontend
- 🔲 Admin: "Onboarding Templates" section in the Administration area — create/edit task lists per department
- 🔲 Employee: onboarding checklist visible on the Dashboard until all tasks are complete
- 🔲 Dashboard: show an "Onboarding incomplete" banner with progress bar for new employees

---

## 8. Role Expansion — Manager Role 🔲

**Goal:** The current system only has `admin` and `user` roles. A `manager` role is needed so that team leads can approve leave and do performance appraisals for their direct reports without having full admin access.

### Backend
- 🔲 Add `'manager'` to the `role` enum on the `users` table
- 🔲 `GET /leave/pending` — return only direct reports' requests for managers (not all employees)
- 🔲 `POST /leave/approve` and `POST /leave/reject` — allow managers to action their direct reports' requests
- 🔲 `GET /performance/manager-reviews` — already exists; enforce that only the assigned manager (or a delegated admin) can see the appraisal form

### Frontend
- 🔲 Sidebar: managers see a limited Administration section: "Leave Approvals" and "Performance Reviews" only (no Manage Employees, no Document Library)
- 🔲 `ManageEmployeesPage`: show manager badge alongside admin badge

---

## 9. Mobile / PWA Improvements 🚧 In Progress

**Goal:** Employees frequently check leave status and sign documents on mobile. The current app is responsive but not optimised for mobile-first usage.

- 🔲 Add a `manifest.json` and service worker to enable "Add to Home Screen" / PWA install
- 🔲 Offline mode for the Dashboard: cache leave balances and pending items so the page loads without network
- 🔲 Bottom navigation bar on mobile (replaces the slide-out sidebar for key actions: Dashboard, Request Leave, My Requests, Notifications)
- 🔲 Touch-optimised signature pad in the document signing modal (larger canvas, stylus support)

---

## 10. Integrations 🔲

### 10.1 SimplePay Payslip Integration
- 🔲 `ALTER TABLE users ADD simplepay_employee_id VARCHAR(100) NULL`
- 🔲 `GET /payslips` — proxy to SimplePay API, return payslip list for the logged-in employee
- 🔲 Frontend: "Payslips" page under Workspace — list of payslips with download links
- 🔲 Create `payslip_otp_sessions` table for secure one-time download tokens

### 10.2 Google / Apple Calendar Sync
- 🔲 `GET /leave/ical/:userId` — generate an iCal feed of the employee's approved leave dates
- 🔲 "Add to Calendar" button on approved leave confirmation toast and leave history cards
- 🔲 One-click subscribe link for Google Calendar and Apple Calendar

### 10.3 Slack / Microsoft Teams Notifications
- 🔲 Admin setting: configure an incoming webhook URL per channel
- 🔲 Leave approval/rejection events: post a summary card to the configured Slack/Teams channel
- 🔲 Weekly digest: Monday morning message with the week's leave schedule across all teams

---

## Pending DB Migrations Summary

| Migration | Needed For |
|---|---|
| `CREATE TABLE leave_reminder_log` | Leave Automation §3.1 |
| `ALTER TABLE leave_requests MODIFY status` (add `expired`) | Leave Automation §3.2 |
| `ALTER TABLE documents ADD version, signature_data, signed_at, ip_address, user_agent` | Document Signatures §1.1 / §1.3 |
| `ALTER TABLE documents ADD expires_at, renewal_period_days` | Document Expiry §1.5 |
| `CREATE TABLE document_audit_log` | Audit Trail §1.6 |
| `CREATE TABLE onboarding_templates` | Onboarding §7 |
| `ALTER TABLE users MODIFY role` (add `manager`) | Role Expansion §8 |
| `ALTER TABLE users ADD simplepay_employee_id` | SimplePay §10.1 |
| `CREATE TABLE payslip_otp_sessions` | SimplePay §10.1 |
| `ALTER TABLE manager_reviews ADD delegated_to` | Performance Review §2.4 |
