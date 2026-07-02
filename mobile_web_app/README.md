# LMS Mobile Web App

Mobile-optimised React + TypeScript + Vite build of the LMS (mirrors key screens from `frontend/`, including the leave calendar). Deployed to the mobile staging/production CloudFront distributions.

## Running locally

```bash
cd mobile_web_app
npm install
npm run dev
```

Backend, database, and seed instructions are the same as the main app — see [frontend/README.md](../frontend/README.md) and [backend/README.md](../backend/README.md).

> Note: `src/components/CalendarSection.tsx` is a copy of the frontend version — when changing one, mirror the change in the other.
