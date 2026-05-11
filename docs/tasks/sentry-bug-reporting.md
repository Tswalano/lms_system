# Task: Sentry Bug Reporting + Crash Alerts

**Status:** Pending  
**Priority:** High

## What this does
- **Automatic crash detection** — React Error Boundary catches any render crash, sends it to Sentry with a full stack trace and session replay so you can see exactly what the user did before it broke.
- **User-submitted bug reports** — wires the existing SupportPage form (currently just `console.log`s) to Sentry's User Feedback API.
- **User identity on errors** — Sentry knows who was logged in when a crash happened (name, email, role).

## Before you start (one-time Sentry setup)
1. Go to [sentry.io](https://sentry.io) → Create account → New Project → **React**
2. Copy the DSN (looks like `https://abc123@o123.ingest.sentry.io/456`)
3. Paste it into `frontend/.env` and `frontend/.env.production`:
   ```
   VITE_SENTRY_DSN=<your-dsn-here>
   ```
4. Add `VITE_SENTRY_DSN` to GitHub repo → Settings → Secrets → Actions

---

## Files to change

| File | What changes |
|---|---|
| `frontend/package.json` | Add `@sentry/react` dependency |
| `frontend/src/main.tsx` | Init Sentry + wrap `<App>` with `Sentry.ErrorBoundary` |
| `frontend/src/contexts/AuthContext.tsx` | Set Sentry user on login, clear on logout |
| `frontend/src/pages/SupportPage.tsx` | Replace `console.log` with `Sentry.captureFeedback()` |
| `frontend/src/components/CrashFallback.tsx` | **New** — full-page crash UI |
| `frontend/.env` | Add `VITE_SENTRY_DSN=` |
| `frontend/.env.production` | Add `VITE_SENTRY_DSN=` |
| `.github/workflows/workflow.yml` | Pass `VITE_SENTRY_DSN` secret into the build step |

---

## Step-by-step implementation

### 1. Install the SDK
```bash
cd frontend && npm install @sentry/react
```

### 2. `frontend/src/main.tsx` — Init Sentry and wrap the app
```ts
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './index.css';
import App from './App.tsx';
import CrashFallback from './components/CrashFallback.tsx';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: 0.1,         // trace 10% of page loads
  replaysOnErrorSampleRate: 1.0, // full replay on every crash
  replaysSessionSampleRate: 0,   // no ambient recording (saves quota)
  enabled: !!import.meta.env.VITE_SENTRY_DSN, // silent in local dev if DSN not set
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<CrashFallback />} showDialog>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
```

> **Why `main.tsx` and not `App.tsx`?** Placing the boundary here catches crashes inside ThemeProvider, QueryClientProvider, and AuthProvider too — not just page components.

### 3. `frontend/src/components/CrashFallback.tsx` — New file
```tsx
import * as Sentry from '@sentry/react';
import { AlertTriangle, RefreshCw, Flag } from 'lucide-react';

const CrashFallback: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <div className="max-w-md w-full text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Something went wrong
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          An unexpected error occurred. Our team has been notified automatically.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          <RefreshCw size={15} />
          Reload page
        </button>
        <button
          onClick={() => Sentry.showReportDialog()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
        >
          <Flag size={15} />
          Report details
        </button>
      </div>
    </div>
  </div>
);

export default CrashFallback;
```

### 4. `frontend/src/contexts/AuthContext.tsx` — Set user identity
After the `setUser(userData)` call that stores the logged-in user (search for where `user` state is set from the token/API response), add:
```ts
import * as Sentry from '@sentry/react';

// After setting user state on login:
Sentry.setUser({
  id: userData.id,
  email: userData.email,
  username: `${userData.firstName} ${userData.lastName}`,
});

// In the logout handler where user state is cleared:
Sentry.setUser(null);
```

### 5. `frontend/src/pages/SupportPage.tsx` — Wire form to Sentry
Add at the top:
```ts
import * as Sentry from '@sentry/react';
```

Add a `submitted` state:
```ts
const [submitted, setSubmitted] = useState<'idle' | 'success' | 'error'>('idle');
```

Replace `handleFormSubmit`:
```ts
const handleFormSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const eventId = Sentry.captureMessage(`[Support] ${formData.subject}`, {
      level: 'info',
      tags: { category: formData.category, priority: formData.priority },
    });
    Sentry.captureFeedback({
      name: formData.name,
      email: formData.email,
      message: `[${formData.category} / ${formData.priority}] ${formData.subject}\n\n${formData.message}`,
      associatedEventId: eventId,
    });
    setSubmitted('success');
    setFormData({ name: '', email: '', subject: '', category: '', priority: 'medium', message: '' });
  } catch {
    setSubmitted('error');
  }
};
```

Show success/error state near the submit button using the already-imported `CheckCircle` and `AlertCircle` icons.

### 6. `.env` and `.env.production`
Add this line to both files:
```
VITE_SENTRY_DSN=
```

### 7. `.github/workflows/workflow.yml` — Pass DSN to build
Find the "Install dependencies and build" step and add under its `env:` block:
```yaml
env:
  VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}
```

---

## Key decisions

| Decision | Reason |
|---|---|
| `enabled: !!VITE_SENTRY_DSN` | Works in local dev with no DSN — no noise or console errors |
| `replaysOnErrorSampleRate: 1.0` | Full session replay on any crash — see exactly what the user did |
| `replaysSessionSampleRate: 0` | No ambient recording — preserves the free tier quota for real errors |
| `captureMessage` + `captureFeedback` together | Links the user's typed description to a traceable Sentry event in Issues |
| `showDialog` on `ErrorBoundary` | Sentry's crash dialog asks "what were you doing?" — gives extra context automatically |

---

## Verification checklist
- [ ] `npm run dev` works with no DSN set — no errors, app loads normally
- [ ] Set `VITE_SENTRY_DSN` in `.env` → throw a test error in any component → appears in Sentry dashboard → Issues
- [ ] Submit SupportPage form → appears in Sentry → User Feedback tab
- [ ] Crash renders `CrashFallback` with "Reload" and "Report details" buttons
- [ ] "Report details" opens Sentry's report dialog
- [ ] Deployed build: Sentry event shows `environment: production` and the logged-in user's email
