# LMS Application — Feature Guide

> Covers: seed file setup, Performance Review (end-to-end), and Document Management (end-to-end).

---

## Table of Contents

1. [Running the Seed Files](#1-running-the-seed-files)
2. [Performance Review — How It Works](#2-performance-review--how-it-works)
3. [Document Management — How It Works](#3-document-management--how-it-works)
4. [Testing From Scratch — Reset Queries](#4-testing-from-scratch--reset-queries)

---

## 1. Running the Seed Files

All seed scripts live in `backend/prisma/`. They connect to whichever database is set in `backend/.env` via the `DATABASE_URL` variable.

### Prerequisites

```bash
# From the backend directory
cd backend
npm install
```

Make sure `backend/.env` has the correct `DATABASE_URL` pointing to your target database:

```env
# Development
DATABASE_URL="mysql://admin:<password>@lms-database-dev.<host>.af-south-1.rds.amazonaws.com/lms_database"

# Production (commented out by default — uncomment only when intentional)
# DATABASE_URL="mysql://lmsAdmin:<password>@lms-db-prod-cluster.<host>.af-south-1.rds.amazonaws.com:3306/lms_db"
```

---

### Seed File 1 — `seed.ts` (Users, Departments, Leave Data)

Seeds the core application data: departments, users, leave requests, documents, notifications, and sample performance history.

```bash
cd backend
npx ts-node -r dotenv/config prisma/seed.ts
```

**What it creates:**
- 4 existing admin users (Glen Mogane, Xolani Zulu, Hannes Swanepoel, Philemon Maitisa)
- 8 additional employee users with randomised job titles
- Department records (Engineering, etc.)
- Leave requests for the **next 3 months** — 3 per month, scattered across each month (mostly pending, some pre-approved)
- Sample documents, with onboarding auto-assignment configured on two of them (*Employee Handbook 2025* for everyone; *Code Review Guidelines* scoped to Engineering, due in 14 days)
- An **active test performance review cycle** ("Seed Test Cycle", `isTest = true`) where each of the 4 existing admins is their own peer reviewer and manager appraiser — any of those accounts can walk the full review circle (self → peer → manager appraisal → admin review) immediately. Test cycles are excluded from reports and can be deleted from the admin page.

**When to run:** Once on a fresh database, or to repopulate a wiped development database. It is safe to run multiple times — it uses upserts where possible. Run `seed-review-questions.ts` first so the test cycle gets pre-created response stubs.

---

### Seed File 2 — `seed-review-questions.ts` (Performance Review Questions)

Seeds all review questions used by the self-review, peer review, manager appraisal, and next-steps forms. This is a **required prerequisite** before using the Performance Review feature — without it, the review forms will be empty.

```bash
cd backend
npx ts-node -r dotenv/config prisma/seed-review-questions.ts
```

**What it creates:**

| Review Type | Categories |
|---|---|
| `manager_appraisal` (employees) | Technical Competence, Delivery & Reliability, Growth & Collaboration |
| `manager_appraisal` (managers, `targetRole = 'manager'`) | Strategic Leadership, Team Development, Delivery & Accountability, Stakeholder Management, Culture & Collaboration |
| `peer_review` | Communication Effectiveness, Client Alignment, Reliability and Delivery, Collaboration and Support, Contribution to Infrastructure |
| `self_review` | Technical Contribution, Leadership in Projects, Learning and Application |
| `next_steps` | Development goals and support needs |

It also creates the **Default Review Set** (`question_sets` with `isDefault = true`) containing every seeded question. Employees without an explicit question-set assignment answer this set; admins can create additional sets and assign them per employee at `/performance-review-admin/questions`.

**When to run:** After any migration that adds or alters the `review_questions` table, or any time the questions seem missing. It uses `upsert` with a stable deterministic ID (hash of the question content), so running it multiple times will not create duplicates.

**Verify questions loaded correctly:**

```sql
SELECT COUNT(*), reviewType FROM review_questions GROUP BY reviewType;
```

Expected output:

```
count | reviewType
------+-------------------
   14 | manager_appraisal   (7 for employees + 7 for managers)
    5 | peer_review
    3 | self_review
    2 | next_steps
```

---

### Seed Script 3 — `clear-review-questions.ts` (Wipe Question Bank)

Deletes every review question, question set, and set membership so `seed-review-questions.ts` can be run again from a clean slate — useful after iterating on the question bank during development.

```bash
cd backend
# Dry run first — reports what would be deleted, makes no changes
npx ts-node -r dotenv/config prisma/clear-review-questions.ts

# Actually delete
npx ts-node -r dotenv/config prisma/clear-review-questions.ts --yes
```

**Important:** `review_responses` has a non-cascading foreign key to `review_questions`, so this script deletes **all recorded responses across every cycle** (self, peer, and manager answers) before it can remove the questions. `review_cycles` and `performance_reviews` themselves are left in place — just with their responses gone. If you also want a clean slate for cycles/reviews, run the reset queries in [§4](#4-testing-from-scratch--reset-queries) too.

After clearing, reseed with:

```bash
npx ts-node -r dotenv/config prisma/seed-review-questions.ts
```

---

### Running Migrations

If the schema has changed and the database is behind:

```bash
cd backend
npx prisma migrate deploy
```

To generate the Prisma client after a schema change:

```bash
npx prisma generate --schema=prisma/schema.prisma
```

---

## 2. Performance Review — How It Works

### 2.1 Overview

The performance review system runs in quarterly **cycles**. Each cycle produces three types of review per employee:

| Review Type | Who fills it in | Weighting |
|---|---|---|
| Self-Review | The employee themselves | 20% of final score |
| Peer Review (×3) | 3 randomly assigned colleagues | 30% of final score |
| Manager Appraisal | Their direct manager (or admin) | 50% of final score |

The **final weighted score** is calculated on the frontend using these weights from `frontend/src/lib/performanceReview.ts`.

---

### 2.2 Cycle States

```
draft  →  active  →  closed
```

| State | What can happen |
|---|---|
| `draft` | Cycle exists but nothing is accessible to employees. Admin can delete or activate it. |
| `active` | All review forms are open. Employees can save and submit. No changes can be made to peer nominations once active. |
| `closed` | All submissions are locked. Read-only. CSV export becomes available in Review History. |

---

### 2.3 Step-by-Step Flow (Admin)

#### Step 1 — Create a Cycle

Navigate to **Administration → Performance Reviews**.

Click **New Cycle**, enter:
- Cycle name (e.g. `Q2 2025`)
- Start date
- End date

The cycle is saved as `draft`. Nothing is visible to employees yet.

#### Step 2 — Set Peer Nominations (Optional Override)

While the cycle is still in `draft`, you can manually set which peers will review each employee using the **Nominate Peers** button on each employee row. The system will auto-assign random peers on activation if you skip this step.

Peer assignment rules applied on activation:
- Each employee gets **3 peer reviewers** (fewer if the team is very small)
- A peer cannot review themselves
- A peer cannot be assigned to review their own manager

#### Step 3 — Activate the Cycle

Click **Activate** on the cycle. This triggers the backend to:

1. Set `review_cycles.status = 'active'`
2. Create `peer_review_assignments` rows (who reviews whom)
3. Create a `performance_reviews` row of type `self_review` for every active user
4. Create a `performance_reviews` row of type `manager_appraisal` for every active user
5. Create a `performance_reviews` row of type `peer_review` for every peer assignment
6. Create stub `review_responses` rows for every self-review and next-steps question (so saves work immediately)
7. Link each `peer_review_assignments.performanceReviewId` back to the created peer review record
8. Send in-app notifications to all employees ("your self-review is now open")
9. Send in-app notifications to all peer reviewers ("you have peer reviews to complete")

**Important:** Activation only works if the cycle is currently in `draft`. You cannot re-activate a closed cycle.

#### Step 4 — Monitor Progress

The admin page shows a live summary per employee:
- Self-review status (not started / in progress / submitted)
- Peer review completion count (e.g. 2/3 complete)
- Manager appraisal status
- Average final score (once appraisals are submitted)

#### Step 5 — Write Manager Appraisals

Once an employee's self-review is submitted, the admin/manager can click **Write Appraisal** to open the manager appraisal form for that employee.

The form is split by category (Technical Competence, Delivery & Reliability, etc.). Each question has:
- A guidance note explaining the rating scale
- A 1–5 star rating
- An optional text note

Ratings auto-save with a debounce (800ms after the last keystroke/click). A save-status indicator (typing → saving → saved) shows per question.

#### Step 6 — Close the Cycle

When the review period ends, click **Close Cycle**. This:
1. Sets `review_cycles.status = 'closed'`
2. Blocks any further submissions (`review_responses` and `submit` endpoints return 400 for closed cycles)
3. Makes the cycle appear in **Review History** (admin view only)
4. Unlocks the **Export CSV** button for full data export

**Closing is irreversible.** A closed cycle cannot be re-opened.

---

### 2.4 Step-by-Step Flow (Employee)

Navigate to **Workspace → My Reviews**.

The page shows the current active cycle. If no cycle is active, the page shows a "no active cycle" state.

#### Tab 1 — Self-Review

All self-review questions grouped by category. For each question:
- Rate yourself 1–5 (required)
- Add a text response (optional unless the question is text-only)

Responses auto-save every 800ms after you stop typing/clicking. Once all required questions have a rating, the **Submit** button becomes available. Submitting locks the self-review — you cannot edit it afterwards.

#### Tab 2 — Reviews to Complete (Peer Reviews)

Lists the colleagues you have been assigned to review. Each card shows:
- The colleague's name and job title
- Your current progress (e.g. 4/9 questions answered)
- A **Start / Continue** button

Clicking opens the peer review form for that person. The form works identically to the self-review (rate 1–5, optional text, auto-save, submit locks it).

#### Tab 3 — Next Steps

A separate short form for development goals. Answers here are visible to your manager. This tab is only enabled after you have submitted your self-review.

#### Viewing Final Scores

Once the cycle is closed and your manager has submitted your appraisal, the page will show:
- Your overall weighted score
- Breakdown by reviewer type (self / peer / manager)
- Manager score breakdown by category

---

### 2.5 Step-by-Step Flow (Admin — Submissions Review)

Click **View Submissions** next to any employee on the admin page.

This opens a three-tab view:

**Manager tab** — the manager appraisal ratings grouped by category, with notes.

**Peers tab** — aggregated peer scores per category, plus individual peer reviewer breakdowns. Admins can apply a calibration override to any peer's rating and add a note explaining the adjustment.

**Self tab** — the employee's self-ratings. Admins can similarly override and note.

---

### 2.6 Review History (Archive)

Once a cycle is closed it moves to **Administration → Review History**.

This page shows all closed cycles. For each cycle you can:
- View the full score summary table (all employees, all weighted scores)
- **Export to CSV** — downloads a spreadsheet with:
  - Employee name, department, job title
  - Self score, peer average score, manager score, final weighted score
  - Manager feedback notes by category
  - Peer feedback aggregated (anonymised per reviewer)
  - Self-review text responses

The history page is **read-only** — no edits, no re-submissions, no re-activation.

---

### 2.7 Question Management & Question Sets (Admin)

Admins manage the question bank at **`/performance-review-admin/questions`** ("Manage questions" button on the admin page):

- **Questions tab** — create, edit, reorder, activate/deactivate questions per review type. Questions with recorded responses are deactivated instead of deleted so history stays intact.
- **Question Sets tab** — group questions into named sets. One set can be marked **default**; it is what employees answer when they have no specific assignment. The seed creates a "Default Review Set" containing all questions.
- **Employee Assignments tab** — assign a set to an individual employee, either globally or for one cycle. Resolution order per employee: cycle-specific set → global set → default set → all active questions.

Changing sets for an **active** cycle takes effect after running **Sync** on that cycle (button on the assignments tab / admin page).

### 2.8 Test Cycles (Full-Circle Testing)

A cycle created with the **"Test cycle"** checkbox lets a single account validate the whole flow before real users are onboarded:

1. Create a cycle with *Test cycle* ticked, then **Activate** — a participant picker appears; select one or more employees.
2. Each participant becomes **their own peer reviewer and manager appraiser**.
3. From the participant's login: complete the self-review, the peer review (of themself), and the manager appraisal (button in the amber test banner).
4. As admin: view submissions, apply overrides, close and export.
5. Test cycles show amber **TEST** badges, are excluded from `/admin/summary` and exports by default, and can be **deleted** from the admin page (removes all reviews/responses/assignments they created).

The seed creates an active "Seed Test Cycle" with the 4 existing admins as participants.

### 2.9 Database Tables Reference

| Table | Purpose |
|---|---|
| `review_cycles` | One row per review cycle (`isTest` flags test cycles) |
| `peer_review_assignments` | Which employee reviews which colleague per cycle |
| `performance_reviews` | One row per (employee, cycle, reviewType) combination |
| `review_responses` | Individual question answers — FK to `performance_reviews` |
| `review_questions` | Question bank (managed at /performance-review-admin/questions) |
| `question_sets` / `question_set_questions` | Named question groupings with ordered membership |
| `employee_question_set_assignments` | Per-employee set assignment (global or per cycle) |
| `manager_feedback` | Admin calibration overrides and notes |

---

## 3. Document Management — How It Works

### 3.1 Overview

Documents (policies, handbooks, compliance files) are uploaded by admins, organised into folders, assigned to employees, and tracked through a sign-off flow. The admin can monitor who has signed and send email reminders to those who haven't.

---

### 3.2 Document Status (Admin View)

| Status | Meaning |
|---|---|
| `active` | Visible and assignable to employees |
| `draft` | Not yet visible to employees |
| `archived` | Removed from active circulation; employees who already signed keep their record |

---

### 3.3 Employee Assignment Status

Each `user_document_assignments` row tracks the individual employee's progress:

| Status | Meaning |
|---|---|
| `pending` | Assigned but not yet opened |
| `viewed` | Opened in the document viewer at least once |
| `completed` | Acknowledged/signed — `document_signatures.signed_at` is set |
| `overdue` | `due_date` has passed and status is not `completed` (computed at query time, not stored) |

---

### 3.4 Step-by-Step Flow (Admin)

#### Step 1 — Create a Folder (Optional)

Navigate to **Administration → Document Library**.

Click **New Folder** in the left sidebar. Provide:
- Folder name
- Colour (for visual grouping)
- Department (optional — documents in this folder default to that department)

#### Step 2 — Upload a Document

Click **Add Document**. Fill in:
- Document name
- File upload **or** an external URL (e.g. a SharePoint/Confluence link)
- Folder assignment
- Status (`draft` to hide, `active` to publish)
- Priority (`standard`, `high`, `critical`)
- Due date (how long employees have to sign)
- Mandatory toggle

Click **Save** — the file is uploaded to S3 and a DB record is created.

#### Step 3 — Assign to Employees

Open the document and click **Assign**. Select individual employees or an entire department. This creates a `user_document_assignments` row per employee with status `pending`.

New employees joining after the document was created must be manually assigned (auto-assignment on hire is on the roadmap).

#### Step 4 — Monitor Signatures

Click **View Signatures** on any document. A modal shows:
- Total assigned count
- How many have signed (signature rate as a percentage)
- A row per employee showing their name, status, and sign date (if signed)

From this modal you can:
- **Send individual reminder** — fires an email to that specific employee
- **Send bulk reminders** — emails all unsigned employees for documents older than 15 days (with a cooldown per employee to prevent flooding)

#### Step 5 — Archive a Document

When a document is no longer needed (replaced by a newer version, or policy retired), set its status to `archived` in the Edit Document modal.

Archived documents:
- Do not appear in the employee's document list
- Retain all historical signature records
- Can be viewed by admins in a filtered "Archived" view

---

### 3.5 Step-by-Step Flow (Employee)

Navigate to **Workspace → Documents**.

The page shows all documents assigned to you, grouped by folder. You can filter by status (All / Pending / Signed / Viewed / Overdue) and search by name.

#### Step 1 — View a Document

Click **View** on any document. This opens the Document Viewer:

- **PDF** — rendered inline in an iframe
- **Office files** (DOCX, XLSX, PPTX) — loaded in Microsoft Office Online viewer, with Google Docs viewer as fallback
- **Images** — displayed directly
- **External URL** — redirected to the URL in a new tab

Opening a document marks its assignment status as `viewed` (if it was previously `pending`).

#### Step 2 — Sign / Acknowledge

While the document is open, click the **Sign** button (visible when status is `pending`, `viewed`, or `overdue`).

A confirmation modal appears with a legal notice: *"By signing, you confirm you have read and understood this document."*

Clicking **Confirm** sends a request to `POST /user-docs/document-completion` which:
1. Inserts a row into `document_signatures` with `signed_at = NOW()`
2. Updates `user_document_assignments.status = 'completed'`
3. Records `completed_at` timestamp

The document now shows as **Signed** in your list with the date.

#### Step 3 — Download

At any point, click **Download** to save a local copy of the file (only available for uploaded files, not external URLs).

---

### 3.6 Supported File Types

| Type | Viewer used |
|---|---|
| PDF | Native iframe embed |
| DOCX, XLSX, PPTX | Microsoft Office Online → Google Docs (fallback) → direct link |
| ODT, ODS, ODP | Google Docs viewer → direct link |
| JPG, PNG, GIF, BMP, WEBP, SVG | Inline image display |
| TXT, MD, JSON, XML, LOG | Inline iframe |
| CSV | Download prompt (no inline preview) |
| External URL | Redirect to URL in new tab |

---

### 3.7 Email Reminders

The system can send email reminders to employees who have not signed a document.

**Individual reminder** — triggered manually by an admin from the View Signatures modal. Sends immediately.

**Bulk reminder** — triggers for documents older than 15 days that still have unsigned employees. Controlled by a cooldown per employee (stored in a `document_reminders` log table) to prevent the same person receiving daily emails. Bulk reminders respect the cooldown and skip recently reminded employees.

---

### 3.8 Bulk & Automatic Assignment

**Bulk assignment** — the "Assign to employee" panel in the admin document modal is a multi-select: search, tick multiple employees (or "Select all shown") and assign in one action (`POST /admin-docs/assignments/bulk`). Department-wide or company-wide selections resolve server-side to individual per-employee assignment records, so tracking stays per employee. Newly assigned employees receive an in-app notification and an email.

**Onboarding auto-assignment** — the "Auto-assign to new employees" panel on a document enables the `auto_assign_new_users` flag, optionally scoped by department and/or role with a due window. When an admin creates a new employee (`POST /add-user`), matching documents are assigned automatically. `POST /admin-docs/assignments/sync-onboarding` backfills an existing employee (or all employees) idempotently.

---

### 3.9 Database Tables Reference

| Table | Purpose |
|---|---|
| `documents` | One row per document (metadata, S3 key, status) |
| `document_categories` | Folders that documents are grouped into |
| `user_document_assignments` | Per-employee assignment and status tracking |
| `document_signatures` | Sign-off record — `signed_at` is the timestamp of acknowledgement |
| `document_reminders` | Log of reminder emails sent (used for cooldown enforcement) |
| `document_training_metadata` | Per-document flags incl. `auto_assign_new_users` |
| `document_auto_assign_rules` | Optional department/role scoping + due-days for auto-assignment |
| `document_tag_mappings` | Optional tags on documents |

---

## 4. Testing From Scratch — Reset Queries

### Performance Review — Full Reset

Run in this order to respect foreign key constraints. **Do not touch `review_questions`.**

```sql
-- Break the FK from peer_review_assignments → performance_reviews (no cascade on that side)
UPDATE peer_review_assignments SET performanceReviewId = NULL;

-- Delete reviews — cascades review_responses and manager_feedback automatically
DELETE FROM performance_reviews;

-- Delete cycles — cascades peer_review_assignments automatically
DELETE FROM review_cycles;
```

After clearing, re-seed questions if needed:

```bash
cd backend
npx ts-node -r dotenv/config prisma/seed-review-questions.ts
```

Then create a new cycle from the admin UI and activate it.

**Checklist before activating:**
- [ ] At least 2 users have `isActive = true` in the `users` table (otherwise peer assignments cannot be created)
- [ ] `review_questions` has rows for all four `reviewType` values (verify with the SQL in §1 above)
- [ ] The cycle name is unique — the `performance_reviews` table has a unique constraint on `(employeeId, reviewPeriod, reviewType, revieweeId)`, so two cycles with the same name will silently skip duplicate creation

---

### Document Management — Full Reset (Dev Only)

```sql
DELETE FROM document_reminders;
DELETE FROM document_signatures;
DELETE FROM user_document_assignments;
DELETE FROM document_tag_mappings;
DELETE FROM documents;
DELETE FROM document_categories;
```

After clearing, use the admin UI to create folders and upload documents fresh.
