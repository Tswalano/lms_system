# Deployment & Rollback Plan — `dev` → `main`

**Branch:** `dev`  
**Target:** `main` (Production on AWS / CloudFront + Lambda + RDS)  
**Date prepared:** 2026-05-06  
**Prepared by:** Glen Mogane  

---

## 1. Overview

This document covers the step-by-step deployment of all changes on `dev` into `main`, including three Prisma database migrations against the live RDS MySQL instance, and a full rollback path back to the pre-merge state of `main`.

### What is being deployed

| Area | Change summary |
|------|---------------|
| **Database** | 3 new migrations (document reminders table, full performance-review cycle schema, `targetRole` column on review questions) |
| **Backend (Lambda)** | Performance review routes, notification routes, admin-doc routes, user-doc routes, Outlook calendar integration, CORS fix, Prisma binary target fix (`rhel-openssl-3.0.x`), auth middleware enhancements |
| **Frontend (CloudFront/S3)** | Performance review pages (employee, peer, manager appraisal, admin, history, submissions), notification center, employee documents, refactored pagination (default 5, hide <5), leave card fixes, calendar single-click fix, UI-wide dark-mode and responsive improvements |
| **CI/CD** | `workflow.yml` — new `target` input (`both` / `backend-only` / `frontend-only`), `prisma generate` step added |

---

## 2. Pre-Deployment Checklist

Complete **before** merging or running the pipeline.

- [ ] Confirm RDS instance has a **manual snapshot** taken and labelled `pre-feat-performance-review-YYYYMMDD`
- [ ] Tag and record the current `main` HEAD SHA (see **§2.1** below)
- [ ] Verify all Prisma migrations run cleanly on a **staging database clone** (see **§2.2** below)
- [ ] Confirm AWS credentials (GitHub Secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_ACCOUNT_ID`) are valid
- [ ] Confirm `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION` secrets are set
- [ ] Schedule a **maintenance window** or deploy during low-traffic hours
- [ ] Notify the team of the deployment window

---

### 2.1 — Tagging the current `main` SHA

This creates a permanent, named restore point so you can roll back to exactly where `main` was before the merge, without relying on branch memory or scrolling through `git log`.

```bash
# 1. Make sure your local main is up to date
git fetch origin
git checkout main
git pull origin main

# 2. Record the SHA (save this somewhere — Slack, Notion, deployment ticket)
git rev-parse main
# e.g. outputs: a3f9c2e1d4b7...

# 3. Create an annotated tag at the current main tip
git tag -a rollback/pre-dev \
  -m "Rollback point before dev merge ($(date +%Y-%m-%d))"

# 4. Push the tag to the remote so the whole team can use it
git push origin rollback/pre-dev

# 5. Verify the tag is visible on the remote
git ls-remote --tags origin | grep rollback
```

To restore to this exact point later:
```bash
git checkout main
git reset --hard rollback/pre-dev
git push origin main --force-with-lease
```

---

### 2.2 — Staging validation

Run all three migrations against a **clone of the production database** before touching prod. This catches ENUM conflicts, FK violations, or data-type mismatches with real data.

#### Option A — Clone via RDS snapshot (recommended)

```bash
# 1. Restore the latest prod snapshot to a temporary staging instance
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier lms-staging-validate \
  --db-snapshot-identifier lms-pre-perf-review-YYYYMMDD \
  --db-instance-class db.t3.medium \
  --no-publicly-accessible

# Wait until status = available (~5–10 min)
aws rds describe-db-instances \
  --db-instance-identifier lms-staging-validate \
  --query 'DBInstances[0].DBInstanceStatus'

# 2. Get the endpoint
aws rds describe-db-instances \
  --db-instance-identifier lms-staging-validate \
  --query 'DBInstances[0].Endpoint.Address' --output text
```

#### Option B — Use existing staging database

If a staging RDS instance already exists with a recent copy of production data, use that directly.

#### Run migrations against the staging DB

```bash
cd backend

# Point to the staging instance (never use prod credentials here)
export DATABASE_URL="mysql://<user>:<pass>@<staging-rds-host>:3306/lms_db"

# Dry-run: see what Prisma will apply without executing
npx prisma migrate status

# Apply all pending migrations
npx prisma migrate deploy
```

Expected output:
```
Applying migration `20260424085915_add_document_reminders`       ✓
Applying migration `20260429000000_add_performance_review_cycles` ✓
Applying migration `20260501000000_add_target_role_to_review_questions` ✓
```

#### Validate the result

```bash
# Spot-check critical tables exist and columns are correct
mysql -h <staging-rds-host> -u <user> -p lms_db <<'SQL'
  SHOW TABLES LIKE 'review_cycles';
  SHOW TABLES LIKE 'peer_review_assignments';
  SHOW TABLES LIKE 'document_reminders';
  DESCRIBE performance_reviews;
  DESCRIBE review_questions;
  SELECT COUNT(*) FROM review_questions WHERE reviewType = 'manager_appraisal' AND targetRole IS NULL;
SQL
# The last query should return 0 — all manager_appraisal rows should have targetRole = 'employee'
```

#### Tear down the temporary staging instance (Option A only)

```bash
aws rds delete-db-instance \
  --db-instance-identifier lms-staging-validate \
  --skip-final-snapshot
```

Only proceed to production deployment once **all three migrations apply cleanly** and the spot-checks pass.

---

## 3. Database Migration Overview

### Migrations being applied (in order)

| Order | Migration file | What it does |
|-------|---------------|-------------|
| 1 | `20260424085915_add_document_reminders` | Creates `document_reminders` table with FK to `documents` and `users` |
| 2 | `20260429000000_add_performance_review_cycles` | Creates `review_cycles` and `peer_review_assignments` tables; alters `performance_reviews`, `review_questions`, `review_responses`, `manager_feedback`; drops and recreates FKs and unique indices |
| 3 | `20260501000000_add_target_role_to_review_questions` | Adds `targetRole VARCHAR(50) NULL` to `review_questions`; backfills `'employee'` for existing `manager_appraisal` rows |

### Risk assessment

| Migration | Risk | Reason |
|-----------|------|--------|
| `add_document_reminders` | **Low** | Additive only — new table, no existing table altered |
| `add_performance_review_cycles` | **High** | Drops FK (`performance_reviews_employeeId_fkey`), drops unique index, modifies ENUMs on three tables, creates two new tables, adds multiple new FKs. ENUM changes on live data require careful validation. |
| `add_target_role_to_review_questions` | **Low** | Additive column + `UPDATE` backfill; no existing data deleted |

---

## 4. Deployment Steps

### Step 1 — Snapshot RDS

```bash
# AWS Console → RDS → your instance → Actions → Take snapshot
# Name it: lms-pre-perf-review-YYYYMMDD
# Or via CLI:
aws rds create-db-snapshot \
  --db-instance-identifier <your-rds-instance-id> \
  --db-snapshot-identifier lms-pre-perf-review-$(date +%Y%m%d)
```

Wait for snapshot status to show **available** before proceeding.

### Step 2 — Validate migrations on a staging clone

```bash
# Restore snapshot to a staging instance (or use existing staging DB)
# Point DATABASE_URL to staging
cd backend
DATABASE_URL="mysql://user:pass@staging-rds-host:3306/lms_db" \
  npx prisma migrate deploy

# Verify tables exist and data looks correct
npx prisma studio   # or run manual SQL checks
```

### Step 3 — Merge the branch

```bash
git checkout main
git pull origin main
git merge --no-ff dev -m "feat: merge performance review, notification center, and infra improvements"
git push origin main
```

### Step 4 — Run database migrations on production RDS

> The CI pipeline does **not** run `prisma migrate deploy` automatically — run it manually from a secure environment with production credentials.

```bash
cd backend
DATABASE_URL="mysql://user:pass@prod-rds-host:3306/lms_db" \
  npx prisma migrate deploy
```

Expected output — three migrations applied in sequence:

```
Applying migration `20260424085915_add_document_reminders`
Applying migration `20260429000000_add_performance_review_cycles`
Applying migration `20260501000000_add_target_role_to_review_questions`
```

### Step 5 — Deploy backend via CI

Trigger from GitHub Actions:

- **Workflow:** `LMS Release and Deployment`
- **Action:** `deploy`
- **Target:** `backend-only`
- **Environment:** `prod`

The pipeline will:
1. `npm ci`
2. `npx prisma generate` ← includes `rhel-openssl-3.0.x` binary target
3. `npm run build`
4. `npx cdk deploy`

### Step 6 — Deploy frontend via CI

- **Workflow:** `LMS Release and Deployment`
- **Action:** `deploy`
- **Target:** `frontend-only`
- **Environment:** `prod`

### Step 7 — Smoke test

- [ ] `GET /health` returns `{ status: "healthy", database: "connected" }`
- [ ] Login via `https://lms.disraptor-internal.net` succeeds
- [ ] Dashboard leave cards show correct counts
- [ ] Performance review pages load (Employee, Admin, History)
- [ ] Notification center loads
- [ ] Calendar events open on single click
- [ ] Pagination shows correctly (hidden when < 5 records, defaults to 5)

---

## 5. Rollback Plan

### When to rollback

Trigger a rollback if any of the following occur within 30 minutes of deployment:
- Lambda returns 5xx on more than ~5% of requests
- Database migrations fail partway through
- Core user journeys (login, leave request, leave approval) are broken
- CloudWatch shows unhandled exceptions at an elevated rate

---

### Rollback A — Frontend only (no DB change needed)

If only the frontend is broken, redeploy the previous frontend build from S3:

```bash
# Get the previous S3 build (tagged before deploy) and re-sync
aws s3 sync s3://<bucket>/prod-backup/ s3://<bucket>/prod/ --delete

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id <CLOUDFRONT_DISTRIBUTION_ID> \
  --paths "/*"
```

Or re-trigger the CI pipeline on the `rollback/pre-dev` tag:

```bash
git push origin rollback/pre-dev:refs/heads/main --force
# Then trigger workflow_dispatch → deploy → frontend-only → prod
```

---

### Rollback B — Backend Lambda only (no DB change needed)

```bash
# Revert main to the pre-merge SHA
git checkout main
git reset --hard rollback/pre-dev
git push origin main --force-with-lease

# Trigger CI: deploy → backend-only → prod
```

---

### Rollback C — Full rollback including database

> Use only if the data is in a consistent state or no production data was written after the migrations ran. If users have already created performance review cycles or peer assignments, a DB rollback will delete that data.

#### 3a. Restore RDS from snapshot

```bash
# AWS Console → RDS → Snapshots → lms-pre-perf-review-YYYYMMDD → Restore
# Or CLI:
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier lms-db-rollback \
  --db-snapshot-identifier lms-pre-perf-review-YYYYMMDD

# Once available, update DATABASE_URL in Lambda env to point to the restored instance
aws lambda update-function-configuration \
  --function-name <lambda-function-name> \
  --environment "Variables={DATABASE_URL=mysql://user:pass@rollback-host:3306/lms_db,...}"
```

#### 3b. Revert the code

```bash
git checkout main
git reset --hard rollback/pre-dev
git push origin main --force-with-lease

# Trigger CI: deploy → both → prod
```

#### 3c. Verify rollback

- [ ] `GET /health` returns healthy
- [ ] Login works
- [ ] Leave requests load — no reference to performance review tables
- [ ] No 5xx in CloudWatch

---

### Manual SQL rollback (if snapshot restore is not viable)

If the snapshot restore takes too long and you need the schema back quickly, apply these in reverse order:

```sql
-- Undo migration 3: remove targetRole
ALTER TABLE `review_questions` DROP COLUMN `targetRole`;

-- Undo migration 2: drop new tables and revert altered tables
ALTER TABLE `performance_reviews` DROP FOREIGN KEY `performance_reviews_revieweeId_fkey`;
ALTER TABLE `performance_reviews` DROP FOREIGN KEY `performance_reviews_cycleId_fkey`;
DROP TABLE IF EXISTS `peer_review_assignments`;
DROP TABLE IF EXISTS `review_cycles`;
DROP INDEX `performance_reviews_revieweeId_idx` ON `performance_reviews`;
DROP INDEX `performance_reviews_cycleId_idx` ON `performance_reviews`;
DROP INDEX `performance_reviews_reviewType_idx` ON `performance_reviews`;
DROP INDEX `performance_reviews_employeeId_reviewPeriod_reviewType_revie_key` ON `performance_reviews`;
ALTER TABLE `performance_reviews`
  DROP COLUMN `cycleId`,
  DROP COLUMN `reviewType`,
  DROP COLUMN `revieweeId`,
  MODIFY `status` ENUM('not_started','employee_in_progress','employee_completed','manager_reviewing','discussion_scheduled','discussion_completed','final_review_complete','acknowledged') NOT NULL DEFAULT 'not_started';
ALTER TABLE `review_questions`
  DROP COLUMN `guidanceText`,
  DROP COLUMN `reviewType`,
  DROP COLUMN `subcategory`,
  DROP COLUMN `weight`;
ALTER TABLE `review_responses`
  DROP COLUMN `overrideNote`,
  DROP COLUMN `overrideRating`,
  DROP COLUMN `ratingDecimal`,
  DROP COLUMN `reviewerType`;
ALTER TABLE `manager_feedback` DROP COLUMN `overrideNote`;
-- Restore original unique index on performance_reviews
CREATE UNIQUE INDEX `performance_reviews_employeeId_reviewPeriod_key`
  ON `performance_reviews`(`employeeId`, `reviewPeriod`);
-- Restore original FK
ALTER TABLE `performance_reviews`
  ADD CONSTRAINT `performance_reviews_employeeId_fkey`
  FOREIGN KEY (`employeeId`) REFERENCES `users`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Undo migration 1: drop document_reminders
ALTER TABLE `document_reminders` DROP FOREIGN KEY `document_reminders_document_id_fkey`;
ALTER TABLE `document_reminders` DROP FOREIGN KEY `document_reminders_user_id_fkey`;
DROP TABLE IF EXISTS `document_reminders`;
```

> **Warning:** The ENUM rollback for `performance_reviews.status` will fail if any rows contain the new enum values (`peer_review_pending`, `peer_reviews_in_progress`, `peer_reviews_complete`). Delete or update those rows first.

---

## 6. Communication Plan

| Event | Action |
|-------|--------|
| Deployment starts | Notify team in Slack / WhatsApp |
| Migrations applied | Post confirmation |
| Smoke tests pass | Announce go-live |
| Rollback triggered | Immediate notification — estimated downtime and reason |
| Rollback complete | Post-mortem scheduled |

---

## 7. Key Contacts

| Name | Role | Responsibility |
|------|------|---------------|
| Glen Mogane | Lead Engineer | Deployment execution, rollback decision |
| Hanness S. | 2nd Lead Engineer | Lambda / CDK troubleshooting, deployment support |
| Pontsho M. | DB Admin | RDS snapshot, restore, and manual SQL fallback |
