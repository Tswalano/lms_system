# LMS Application — Feature Roadmap

> Status legend: ✅ Done · 🔲 Pending · 🚧 In Progress · ⚠️ Blocked

---

## 1. Document Signature Feature — Gaps & Improvements

**Current state:** ✅ Fully implemented. Real signature capture (typed or drawn), real progress tracking, document versioning with re-signature enforcement, expiry & renewal, and a full admin audit trail are all in place. Two pre-existing bugs were discovered and fixed along the way: the admin "Edit Document" feature had no backend endpoint at all (silent 404), and document-progress was always reporting ~0 elapsed time because it fired only at viewer-open instead of viewer-close.

---

### 1.1 Real Digital Signature Capture ✅

#### Backend
- ✅ `document_signatures` gained `signature_type` (`typed`|`drawn`), `signature_data TEXT`, `ip_address`, `user_agent`, `document_version` — IP/user-agent are captured server-side from request headers, not trusted from the client, for integrity
- ✅ Unique key widened to `(user_id, document_id, document_version)` so re-signing after a version bump inserts a new history row instead of overwriting
- ✅ `POST /user-docs/document-completion` — accepts and persists `signature_type`/`signature_data`
- ✅ `GET /admin-docs/:document_id/signatures` — returns each signer's captured signature, version, and whether it's still current

#### Frontend
- ✅ Two-step signature modal in `EmployeeDocumentsPage.tsx`: Step 1 confirm-read checkbox, Step 2 choose Type (cursive-rendered) or Draw (`SignaturePad.tsx`, a small dependency-free canvas component)
- ✅ Admin "View Signatures" modal shows each captured signature inline (cursive name or drawn PNG), a `v{n}` tag, and an "Outdated — re-signature required" badge when a signature predates the current version

---

### 1.2 Document Progress Tracking ✅

#### Backend
- ✅ `document-progress` accepts a real `progress_data` shape (`fileType`, `pageNumber`, `totalPages`, `scrollPercentage`, `trackingMethod`)
- ✅ Fixed: assignment status update no longer regresses `signed`/`completed` back to `viewed` if a document is re-opened after signing

#### Frontend
- ✅ Fixed the "always ~0 elapsed" bug: progress is now reported on viewer **close** (with real elapsed time) in addition to open, not only at open
- ✅ PDFs render via PDF.js (`PdfPageViewer.tsx`) instead of a native `<iframe>` plugin, giving real current-page and scroll-percentage tracking (`IntersectionObserver` + scroll listener), with iframe fallback on load failure
- ✅ Office/image/text documents remain time-on-page only — genuinely unreadable via JS since they render in a cross-origin Google/Microsoft iframe

---

### 1.3 Document Versioning ✅

#### Backend
- ✅ Built `PUT /admin-docs/:document_id` from scratch (this endpoint didn't exist — the admin edit feature was silently broken)
- ✅ Repurposed the previously-unused `document_training_metadata.version` field (converted `String?` → `Int @default(1)`) rather than adding a redundant column
- ✅ Uploading a new file increments the version, resets `signed`/`completed` assignments to `pending`, and logs a `version_updated` audit entry with `{fromVersion, toVersion}`; prior signatures are kept as history, not deleted

#### Frontend
- ✅ `EditDocumentModal.tsx` shows the current version and an amber warning when replacing the file ("creates version N+1... everyone who already signed will need to re-sign")

---

### 1.4 Document Assignment Automation ✅

Implemented (branch `feat/performancce-review`):

#### Backend
- ✅ `POST /admin-docs/assignments/bulk` — assign a document to many users at once (`userIds[]`, `departmentId`, or `all`); resolves to individual per-employee assignment records, idempotent
- ✅ Employee creation flow hook: `POST /add-user` auto-assigns documents flagged `auto_assign_new_users`, scoped by optional `document_auto_assign_rules` (department/role, due-days)
- ✅ `POST /admin-docs/assignments/sync-onboarding` — backfill auto-assign documents for one or all existing employees
- ✅ Assignment email (`documentAssigned.html`) + in-app notification on assignment

#### Frontend
- ✅ Multi-select "Assign to employee" panel in the admin document modal (search, select-all, bulk assign)
- ✅ "Auto-assign to new employees" configuration panel (department/role scope + due window)

---

### 1.5 Document Expiry & Renewal ✅

#### Backend
- ✅ Reused the previously-unused `document_training_metadata.expiry_date`/`renewal_frequency` columns (already the right shape) rather than adding new ones
- ✅ `backend/lambda/scheduled/documentExpiryScheduler.ts` — daily EventBridge job (not Mon–Fri; expiry doesn't respect weekends): 14 days before `expiry_date`, resets `signed`/`completed` assignments to `pending` and emails/notifies; past `expiry_date`, marks any still-`pending` assignment `overdue`. Naturally idempotent — reset assignments no longer match the "still signed" query, so no dedupe table is needed
- ✅ New `documentExpiring.html` email template + `senderDocumentExpiring` sender
- ✅ CDK: new scheduled Lambda mirroring the existing scheduler pattern (shared DLQ, CloudWatch alarm)

#### Frontend
- ✅ Expiry date + renewal-frequency fields in `AddDocumentModal.tsx`/`EditDocumentModal.tsx` (replacing a previously-declared-but-unused `expiryFrequency` field)
- ✅ "Expires in X days" / "Expired Xd ago" stat card in the admin document view modal, colour-coded by urgency

---

### 1.6 Audit Trail Page (Admin) ✅

#### Backend
- ✅ `document_audit_log` table exactly as specified, plus `expiring_soon`/`expired` actions
- ✅ `backend/lambda/helpers/documentAudit.ts` — shared `logDocumentAudit()` helper, wired into signing, first-view, assign/bulk-assign, unassign, single/bulk reminders, version updates, and the expiry scheduler
- ✅ `GET /admin-docs/:document_id/audit-log?page=&limit=` — paginated, joins user display names
- ✅ Fixed several signature-listing/reminder queries that would have double-counted rows once signatures could have multiple versions per user (widened unique key from 1.1)

#### Frontend
- ✅ Collapsible "Audit Log" panel in the admin View Signatures modal (same pattern as the existing Assign/Auto-assign panels), with colour-coded action badges and pagination

---

## 2. Performance Review Feature — Gaps & Improvements

**Current state:** All six frontend pages are built and wired to real API endpoints. Cycle management (create → activate → close), employee self-review, peer review, manager appraisal, submissions overview with score overrides, and CSV export all work. Admin question management, question sets with per-employee assignment, single-account **test cycles**, and the cycle-end reminder scheduler are also implemented (see FEATURE_GUIDE §2.7–2.8). The following items are outstanding.

---

### 2.1 Scheduled Cycle-End Reminder ✅

Implemented (branch `feat/performancce-review`):

#### Backend
- ✅ `backend/lambda/scheduled/reviewCycleReminderScheduler.ts` — EventBridge rule, Mon–Fri 8 AM UTC
- ✅ Queries active non-test cycles ending within 3 days
- ✅ Reminds employees with an incomplete self-review or pending peer reviews (per-user digest)
- ✅ In-app notification + SES email (`reviewCycleReminder.html`); deduped to one reminder per user per cycle per day via the notifications table
- ✅ Registered in CDK with a shared dead-letter queue and a CloudWatch error alarm

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

## 4. Leave Balance Management 🔲

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

## 5. Notification System Refactor 🔲

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

## 6. Onboarding Workflow 🔲

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

## 7. Role Expansion — Manager Role 🔲

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

## 8. Mobile / PWA Improvements 🚧 In Progress

**Goal:** Employees frequently check leave status and sign documents on mobile. The current app is responsive but not optimised for mobile-first usage.

- 🔲 Add a `manifest.json` and service worker to enable "Add to Home Screen" / PWA install
- 🔲 Offline mode for the Dashboard: cache leave balances and pending items so the page loads without network
- 🔲 Bottom navigation bar on mobile (replaces the slide-out sidebar for key actions: Dashboard, Request Leave, My Requests, Notifications)
- 🔲 Touch-optimised signature pad in the document signing modal (larger canvas, stylus support)

---

## 9. Integrations 🔲

### 9.1 SimplePay Payslip Integration
- 🔲 `ALTER TABLE users ADD simplepay_employee_id VARCHAR(100) NULL`
- 🔲 `GET /payslips` — proxy to SimplePay API, return payslip list for the logged-in employee
- 🔲 Frontend: "Payslips" page under Workspace — list of payslips with download links
- 🔲 Create `payslip_otp_sessions` table for secure one-time download tokens

### 9.2 Google / Apple Calendar Sync
- 🔲 `GET /leave/ical/:userId` — generate an iCal feed of the employee's approved leave dates
- 🔲 "Add to Calendar" button on approved leave confirmation toast and leave history cards
- 🔲 One-click subscribe link for Google Calendar and Apple Calendar

### 9.3 Slack / Microsoft Teams Notifications
- 🔲 Admin setting: configure an incoming webhook URL per channel
- 🔲 Leave approval/rejection events: post a summary card to the configured Slack/Teams channel
- 🔲 Weekly digest: Monday morning message with the week's leave schedule across all teams

---

## 10. Email Template Refactoring ✅

**Current state:** All email HTML is now in standalone `.html` files under `lambda/email/templates/`. A lightweight renderer (`templateRenderer.ts`) reads and caches them at cold start, interpolating `{{variable}}` placeholders. `templateHtml.ts` contains only TypeScript logic — no inline HTML.

---

### 10.1 Consolidate & Clean Up Template Files ✅

- ✅ Deleted the three unused EJS stubs: `lambda/template.html`, `lambda/email/template.html`, `lambda/email/documentReminderTemplate.html`
- ✅ Created `lambda/email/templates/` directory with three clean `.html` files:
  - `leaveStatus.html` — employee leave approval/rejection/pending notification
  - `managementNotification.html` — admin/management new leave request alert
  - `documentReminder.html` — document signing reminder with document list

---

### 10.2 Placeholder Syntax ✅

Use `{{variableName}}` as the interpolation token throughout all `.html` files. This is human-readable, safe to put inside HTML attributes or text nodes, and requires no dependency.

For the documents list (an array) in `documentReminder.html`, pre-render the repeated block in TypeScript and inject the resulting HTML fragment as a single `{{documentsHtml}}` variable. This avoids needing a loop syntax in the templates and keeps the renderer trivial.

Example placeholder usage in a template:
```
Hello {{name}},
<div class="status-card status-{{statusClass}}">
  <div class="status-title">Leave Request {{statusLabel}}</div>
  <div class="status-message">{{body}}</div>
</div>
```

---

### 10.3 Template Renderer Utility ✅

Created `lambda/email/templateRenderer.ts`:

- ✅ `loadTemplate(name: string): string` — reads the corresponding `.html` file from `./templates/` relative to the module. Uses `fs.readFileSync` with a cached result per template name so the disk read only happens on Lambda cold start.
- ✅ `renderTemplate(name: string, variables: Record<string, string>): string` — loads the template then replaces every `{{key}}` occurrence with `variables[key]`. Throws if a placeholder in the template has no matching key (fail-fast prevents silent blank fields in sent emails).
- ✅ No external dependencies required — a single `str.replace(/\{\{(\w+)\}\}/g, ...)` covers all cases.

---

### 10.4 Refactor `templateHtml.ts` ✅

- ✅ Replaced `emailTemplate()` inline HTML with a call to `renderTemplate('leaveStatus', { name, statusClass, statusLabel, body, year, messageBody })`
- ✅ Replaced `managementEmailTemplate()` inline HTML with `renderTemplate('managementNotification', { employeeName, employeeEmail, statusClass, statusLabel, body, leaveDetailsHtml, managementMessageBody, year })`
- ✅ Replaced `documentReminderTemplate()` inline HTML with: pre-render `documentsHtml` from the documents array, then call `renderTemplate('documentReminder', { employeeName, documentsHtml, portalUrl })`
- ✅ Removed all inline HTML string literals from `templateHtml.ts` — the file contains only TypeScript logic (type definitions, variable preparation, the render calls, and exports)

---

### 10.5 CDK Asset Bundling 🔲

The Lambda bundle must include the `templates/` directory. Without this the renderer's `fs.readFileSync` call will fail at runtime.

- 🔲 In the CDK stack, add `lambda/email/templates` as a bundled asset alongside the compiled JS — either via esbuild `loader` config or by copying the directory as a CDK `Asset` mounted at the same relative path
- 🔲 Smoke-test locally by running the Lambda handler directly (e.g. `ts-node`) and confirming all three templates render without errors before deploying

---

## Pending DB Migrations Summary

| Migration | Needed For |
|---|---|
| `CREATE TABLE leave_reminder_log` | Leave Automation §3.1 |
| `ALTER TABLE leave_requests MODIFY status` (add `expired`) | Leave Automation §3.2 |
| `ALTER TABLE documents ADD version, signature_data, signed_at, ip_address, user_agent` | Document Signatures §1.1 / §1.3 |
| `ALTER TABLE documents ADD expires_at, renewal_period_days` | Document Expiry §1.5 |
| `CREATE TABLE document_audit_log` | Audit Trail §1.6 |
| `CREATE TABLE onboarding_templates` | Onboarding §6 |
| `ALTER TABLE users MODIFY role` (add `manager`) | Role Expansion §7 |
| `ALTER TABLE users ADD simplepay_employee_id` | SimplePay §9.1 |
| `CREATE TABLE payslip_otp_sessions` | SimplePay §9.1 |
| `ALTER TABLE manager_reviews ADD delegated_to` | Performance Review §2.4 |
