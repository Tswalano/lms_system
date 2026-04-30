# Performance Review — Frontend ↔ Backend Integration Tasks

> Status legend: ✅ Done · 🔲 Pending · 🚧 In Progress · ⚠️ Blocked

---

## Current State

All phases complete. The full integration is live: DB migrations → seed data → API routes → frontend rewiring → mock data removed → notifications wired.

---

## Phase 1 — Database Schema ✅ Complete

Migration: `20260429000000_add_performance_review_cycles` — applied and marked resolved.

### 1.1 New tables

- ✅ **`review_cycles`** — Prisma model added, migration applied
- ✅ **`peer_review_assignments`** — Prisma model added, migration applied

### 1.2 Altered tables

- ✅ **`performance_reviews`** — added `cycleId`, `reviewType` (enum), `revieweeId`; updated unique constraint to `(employeeId, reviewPeriod, reviewType, revieweeId)`
- ✅ **`performance_review_status`** enum — added `peer_review_pending`, `peer_reviews_in_progress`, `peer_reviews_complete`
- ✅ **`review_questions`** — added `subcategory`, `weight`, `reviewType` (`question_review_type` enum), `guidanceText`
- ✅ **`review_responses`** — added `ratingDecimal`, `reviewerType` (`response_reviewer_type` enum), `overrideRating`, `overrideNote`
- ✅ **`manager_feedback`** — added `overrideNote`

### 1.3 New enums added to schema

- ✅ `review_cycle_status` — `draft | active | closed`
- ✅ `peer_assignment_status` — `pending | in_progress | completed`
- ✅ `performance_review_type` — `self_review | peer_review | manager_appraisal`
- ✅ `question_review_type` — `self_review | peer_review | manager_appraisal | next_steps`
- ✅ `response_reviewer_type` — `self | peer | manager`

---

## Phase 2 — Seed Data ✅ Complete

- ✅ `backend/prisma/seed-review-questions.ts` — written and run successfully
  - 7 × `manager_appraisal` questions (Technical Competence, Delivery & Reliability, Growth & Collaboration)
  - 5 × `peer_review` questions (Communication, Client Alignment, Reliability, Collaboration, Infrastructure)
  - 3 × `self_review` questions (Technical Contribution, Leadership, Learning)
  - 2 × `next_steps` questions

---

## Phase 3 — Backend API Routes ✅ Complete

`backend/lambda/routes/performance.ts` — fully rewritten with cycle-based model. Route is already mounted at `/performance` in `backend/lambda/index.ts`.

### 3.1 Cycle management (admin)

- ✅ `POST /performance/cycles` — create cycle `{ name, startDate, endDate }`
- ✅ `GET /performance/cycles` — list cycles with stats (`employeeCount`, `nominatedCount`, `submittedCount`, `avgFinalScore`)
- ✅ `POST /performance/cycles/:id/activate` — set active; randomly assign 3 peers per employee (excludes self + manager); creates `peer_review_assignments`
- ✅ `POST /performance/cycles/:id/close` — set closed

### 3.2 Employee endpoints

- ✅ `GET /performance/my-reviews?cycleId=` — self-review + assigned peer reviews
- ✅ `GET /performance/my-peer-assignments?cycleId=` — list of pending/completed peer reviews to write
- ✅ `GET /performance/peer-review/:assignmentId` — full peer review form data
- ✅ `POST /performance/responses` — upsert self or peer response (rating + text)
- ✅ `POST /performance/reviews/:id/submit` — submit review; marks peer assignment as completed

### 3.3 Manager / Admin endpoints

- ✅ `GET /performance/submissions/:employeeId?cycleId=` — full review data with scores
- ✅ `POST /performance/submissions/:employeeId/override` — save manager calibration overrides
- ✅ `GET /performance/admin/summary?cycleId=` — all employees with scores (admin only)

### 3.4 Score calculation

- ✅ Weighted scoring: `manager × 50% + peer × 30% + self × 20%` (matches frontend `WEIGHTS`)
- ✅ Computed server-side on `GET /submissions` and `GET /admin/summary`

---

## Phase 4 — Frontend API Integration

### 4.1 API client / hooks ✅ Complete

All hooks written in `frontend/src/hooks/usePerformanceReview.ts`:

- ✅ `usePerformanceCycles()` — `GET /performance/cycles`
- ✅ `useAdminPerformanceSummary(cycleId?)` — `GET /performance/admin/summary`
- ✅ `useMyPerformanceReview(cycleId?)` — `GET /performance/my-reviews`
- ✅ `useMyPeerAssignments(cycleId?)` — `GET /performance/my-peer-assignments`
- ✅ `usePeerReviewDetail(assignmentId?)` — `GET /performance/peer-review/:assignmentId`
- ✅ `usePerformanceSubmissions(employeeId?, cycleId?)` — `GET /performance/submissions/:employeeId`
- ✅ `useCreateCycle()` mutation
- ✅ `useActivateCycle()` mutation
- ✅ `useCloseCycle()` mutation
- ✅ `useSaveResponse()` mutation
- ✅ `useSubmitReview()` mutation
- ✅ `useSaveOverrides()` mutation

### 4.2 Page rewiring ✅ Complete

- ✅ **`PerformanceReviewAdmin.tsx`**
  - Replace `performanceStore` cycles with `usePerformanceCycles` + `useAdminPerformanceSummary`
  - Wire "Create cycle" dialog → `useCreateCycle()`
  - Wire stats cards to real `employeeCount`, `nominatedCount`, `submittedCount`, `avgFinalScore`

- ✅ **`PerformanceReviewEmployee.tsx`**
  - Replace `usePerformanceCycle(CURRENT_EMPLOYEE_ID, period)` with `useMyPerformanceReview`
  - Replace peer assignment list with `useMyPeerAssignments`
  - Wire self-review saves → `useSaveResponse()`
  - Wire self-review submit → `useSubmitReview()`

- ✅ **`PerformanceReviewPeerPage.tsx`**
  - Use `usePeerReviewDetail(assignmentId)` (route param → assignment ID instead of employeeId)
  - Wire rating/text saves → `useSaveResponse()`
  - Wire submit → `useSubmitReview()`

- ✅ **`PerformanceReviewSubmissionsPage.tsx`**
  - Replace `usePerformanceCycle` with `usePerformanceSubmissions(employeeId, cycleId)`
  - Wire override saves → `useSaveOverrides()`

### 4.3 Remove mock data ✅ Complete

- ✅ Deleted `EMPLOYEES`, `CURRENT_EMPLOYEE_ID`, `performanceStore`, mock hooks, seed data, and score functions from `performanceReview.ts`
- ✅ `MANAGER_CATEGORIES`, `PEER_QUESTIONS` removed (data now comes from API)
- ✅ Kept: `RatingValue`, `RATING_LABELS`, `RATING_TONES`, `RATING_TEXT_TONES`, `WEIGHTS`, `SelfQuestion`, `SELF_QUESTIONS`

---

## Phase 5 — Notifications ✅ Complete

- ✅ Notify employees when cycle is activated (self-review now open) — fired in `POST /performance/cycles/:id/activate`
- ✅ Notify peer reviewers when assigned — fired in same activate endpoint (deduplicated by reviewer)
- 🔲 Remind employees 3 days before cycle `endDate` if self-review is not submitted — requires scheduled job (EventBridge/cron), out of scope for Phase 5
- ✅ Notify manager when all peer reviews for a direct report are complete — fired in `POST /performance/reviews/:id/submit` after final peer marks complete
- ✅ Notify employee when manager appraisal is submitted — fired in same submit endpoint when `reviewType === 'manager_appraisal'`

---

## Integration Checklist

1. ✅ Run DB migrations (Phase 1)
2. ✅ Seed review questions (Phase 2)
3. ✅ Build + test backend API routes (Phase 3)
4. ✅ Build frontend hooks (Phase 4.1)
5. ✅ Rewire pages — Admin → Employee → Peer → Submissions (Phase 4.2)
6. ✅ Remove mock data (Phase 4.3)
7. ✅ Wire notifications (Phase 5)
8. 🔲 End-to-end test: create cycle → activate → self-review → peer review → manager appraisal → admin view
