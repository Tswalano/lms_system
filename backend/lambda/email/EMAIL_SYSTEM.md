# Email System

The LMS sends transactional emails via **AWS SES** from `noreply@disraptor-internal.net`. There are three email types, each backed by a standalone HTML template file and sent through a dedicated function in `emailMiddleware.ts`.

---

## Architecture

```
emailMiddleware.ts          ← public API; validates params, builds SES payload, sends
    └── templateHtml.ts     ← TypeScript logic; prepares variables, calls renderTemplate()
        └── templateRenderer.ts  ← reads & caches .html files, interpolates {{placeholders}}
            └── templates/
                ├── leaveStatus.html
                ├── managementNotification.html
                └── documentReminder.html
```

### How rendering works

`templateRenderer.ts` exposes two functions:

| Function | Purpose |
|---|---|
| `loadTemplate(name)` | Reads `templates/<name>.html` from disk on first call, returns cached string on subsequent calls (important for Lambda warm starts) |
| `renderTemplate(name, variables)` | Loads the template and replaces every `{{key}}` token with the matching value from `variables`. Throws if any placeholder in the template has no matching key. |

---

## Email Types

### 1. Employee Leave Status (`leaveStatus.html`)

Sent to the **employee** when their leave request is created, approved, rejected, or cancelled.

**Sender function:** `sender()` in `emailMiddleware.ts`

**Variables passed to the template:**

| Placeholder | Description |
|---|---|
| `{{name}}` | Employee's first name |
| `{{subject}}` | Email subject line |
| `{{statusClass}}` | CSS modifier — one of `approved`, `rejected`, `pending` |
| `{{statusLabel}}` | Human-readable status — e.g. `Approved` |
| `{{body}}` | Short summary of the status update |
| `{{messageBody}}` | Longer contextual message derived from status (see `STATUS_MESSAGES` in `templateHtml.ts`) |
| `{{year}}` | Current year for the copyright footer |

**Header colour:** indigo/purple gradient

---

### 2. Management Notification (`managementNotification.html`)

Sent to the **management team** when a leave request is submitted or actioned. Recipients are environment-driven (see Environment section below).

**Sender function:** `senderManagement()` in `emailMiddleware.ts`

**Variables passed to the template:**

| Placeholder | Description |
|---|---|
| `{{employeeName}}` | Full name of the employee |
| `{{employeeEmail}}` | Employee's email address |
| `{{subject}}` | Email subject line |
| `{{statusClass}}` | CSS modifier — one of `approved`, `rejected`, `pending`, `cancelled` |
| `{{statusLabel}}` | Human-readable status |
| `{{body}}` | Short status summary |
| `{{leaveDetailsHtml}}` | Pre-rendered HTML rows for optional fields (leave type, start date, end date, duration). Empty string when fields are absent. |
| `{{managementMessageBody}}` | Contextual guidance for the management recipient, derived from status |
| `{{year}}` | Current year |

**Header colour:** red gradient (`#dc2626` → `#991b1b`)

---

### 3. Document Signing Reminder (`documentReminder.html`)

Sent to an **employee** who has unsigned documents assigned to them. Triggered by the scheduled document reminder Lambda.

**Sender function:** `senderDocumentReminder()` in `emailMiddleware.ts`

**Variables passed to the template:**

| Placeholder | Description |
|---|---|
| `{{employeeName}}` | Employee's first name |
| `{{documentsHtml}}` | Pre-rendered HTML block listing each document (name, mandatory badge, due/assigned date) |
| `{{portalUrl}}` | Deep-link URL to the document signing page in the employee portal |

**Header colour:** amber/red gradient (`#f59e0b` → `#ef4444`)

---

## Editing Templates

All visual changes belong in the `.html` files under `templates/`. TypeScript files do not need to change for layout/copy edits.

1. Open the relevant file in `backend/lambda/email/templates/`
2. Edit HTML and CSS directly — use standard browser dev tools for live preview
3. Use `{{placeholderName}}` for dynamic values (see tables above)
4. To add a **new placeholder**, also add the corresponding key to the `variables` object in the matching function inside `templateHtml.ts`

---

## Environment Configuration

Email recipients are controlled by `getEmailConfiguration()` in `emailMiddleware.ts`, based on the `ENVIRONMENT` environment variable:

| Environment | Management To | CC |
|---|---|---|
| `prod` | preneshni.moodley@disraptor.co.za | malloron.nair@disraptor.co.za, hemansu.keeka@disraptor.co.za |
| `dev` (default) | glen.mogane@disraptor.co.za | hanness@disraptor.co.za, xolani@disraptor.co.za |

Subject lines are prefixed with `[DEV]` or `[MANAGEMENT - DEV]` in non-production environments.

---

## Adding a New Email Type

1. Create `templates/<newType>.html` with `{{placeholder}}` tokens
2. Add a builder function in `templateHtml.ts` that calls `renderTemplate('<newType>', { ... })`
3. Add a sender function in `emailMiddleware.ts` that validates input, calls the builder, and sends via SES
4. Ensure the CDK bundle includes the `templates/` directory (see §10.5 in ROADMAP.md)

---

## CDK Bundling Note

`templateRenderer.ts` uses `fs.readFileSync` at runtime. The compiled Lambda bundle must include the `templates/` directory at the same relative path as the compiled JS. This is tracked as item **10.5** in `ROADMAP.md` and must be wired into the CDK esbuild configuration before deploying.
