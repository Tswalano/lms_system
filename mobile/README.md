# LMS Mobile

A React Native mobile application for the Leave Management System (LMS), built with Expo. It provides employees and administrators with a streamlined interface for managing leave requests on iOS and Android.

---

## Features

### Employee
- View leave balances by type (Annual, Sick, Paternity, Family Responsibility)
- Submit leave requests with date range, leave type, and reason
- Choose full-day or half-day leave
- View personal leave history with status filtering
- Cancel pending or future leave requests

### Admin
- Review and approve or reject pending leave requests with comments
- Search and view team members' leave history
- Access all employee leave features

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | React Native 0.81 + Expo 46 |
| Language | TypeScript 5.3 |
| Navigation | React Navigation 7 (Stack + Bottom Tabs) |
| Data Fetching | TanStack React Query 5 |
| HTTP Client | Axios |
| Auth Storage | expo-secure-store |
| UI | Expo Linear Gradient, Expo Vector Icons |
| Date Handling | date-fns, react-native-modal-datetime-picker |

---

## Project Structure

```
mobile/
├── assets/                  # App icons and splash screen
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── LeaveBalanceCard.tsx
│   │   ├── LeaveRequestCard.tsx
│   │   └── StatusBadge.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx  # Auth state, login/logout, token management
│   ├── navigation/
│   │   └── index.tsx        # Role-based navigation (user vs admin tabs)
│   ├── screens/
│   │   ├── auth/            # Login, forgot password, new password
│   │   ├── user/            # Dashboard, apply leave, leave history
│   │   └── admin/           # Approve leave, team leave history
│   ├── services/
│   │   └── api.ts           # Axios client with auto token refresh
│   └── theme/
│       └── colors.ts        # Color palette and design tokens
├── App.tsx                  # Root component with providers
├── app.json                 # Expo app configuration
└── .env.example             # Environment variable template
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- [Expo Go](https://expo.dev/client) app on your iOS or Android device, or a simulator

---

## Getting Started

**1. Install dependencies**

```bash
cd mobile
npm install
```

**2. Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` and set your backend API URL:

```env
EXPO_PUBLIC_API_URL=http://your-api-host:3000
```

> For local development, use your machine's LAN IP address (e.g. `192.168.x.x`) rather than `localhost` so physical devices can reach the server.

**3. Start the development server**

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `i` for iOS simulator / `a` for Android emulator.

---

## Authentication

The app uses token-based authentication with three tokens stored securely via `expo-secure-store`:

| Token | Purpose |
|---|---|
| Access token | Sent with every API request |
| ID token | User identity and role |
| Refresh token | Silently refreshes expired access tokens |

First-login users are prompted to set a new password before accessing the app. Tokens are cleared on logout.

---

## Role-Based Navigation

| Tab | Employee | Admin |
|---|---|---|
| Home | Dashboard | Dashboard |
| Apply | Apply Leave | Apply Leave |
| History | Leave History | My Leaves |
| Approvals | — | Pending approvals |
| Team | — | Team leave history |

---

## Leave Types & Statuses

**Types:** Annual Leave · Sick Leave · Paternity Leave · Family Responsibility

**Statuses:** `pending` · `approved` · `rejected` · `cancelled`

---

## Scripts

| Command | Description |
|---|---|
| `npx expo start` | Start the Expo development server |
| `npx expo start --android` | Start and open on Android emulator |
| `npx expo start --ios` | Start and open on iOS simulator |
| `npx expo build` | Build a production bundle (legacy) |
| `eas build` | Build for production with EAS |

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3000` |

---

## App Configuration

The app is configured in [app.json](app.json):

| Field | Value |
|---|---|
| Name | LMS Mobile |
| Slug | lms-mobile |
| Version | 1.0.0 |
| Bundle ID (iOS) | com.disraptor.lms |
| Package (Android) | com.disraptor.lms |
| Orientation | Portrait only |
