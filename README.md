# BillBuddies 💸

Track shared expenses with roommates, see instant balances, and settle up with
the **minimum number of payments** — all from your phone. BillBuddies is an
installable, touch-first, offline-capable **Progressive Web App** built to run
entirely on **Vercel's free tier**. Free forever, no premium tiers.

![icon](public/icons/icon-192.png)

## Features

- **Log expenses in seconds** — pick a category, amount, and split type (equal,
  exact, or percentage).
- **Instant balances** — the Home screen shows each person's net position
  (green = you're owed, red = you owe).
- **Smart settle-up** — a min-cash-flow algorithm reduces every IOU into the
  shortest possible list of "A pays B $X".
- **Recurring bills** — rent, internet, subscriptions auto-logged daily by a
  Vercel Cron job.
- **Receipt photos** — attach a photo to any expense (stored in Vercel Blob).
- **CSV export** — download the full ledger any time.
- **Full offline support** — add expenses while offline; they queue in
  IndexedDB (Dexie) and sync automatically when you reconnect.
- **Installable PWA** — standalone display, app icons, and a service worker
  that caches the app shell.

## Tech stack (all zero-cost, Vercel-native)

| Concern         | Choice                                            |
| --------------- | ------------------------------------------------- |
| Framework       | Next.js 14 (App Router) + TypeScript              |
| UI              | Tailwind CSS + shadcn/ui + framer-motion          |
| Database        | Vercel Postgres (Neon) via `@vercel/postgres`     |
| File storage    | Vercel Blob (receipt photos)                      |
| Cache           | Vercel KV (Upstash) — optional, for settle plans  |
| Auth            | NextAuth.js v5 (Credentials, JWT, bcrypt hashes)  |
| Cron            | Vercel Cron Jobs (`vercel.json`)                  |
| Offline / PWA   | `next-pwa` service worker + Dexie.js (IndexedDB)  |

No Supabase, Stripe, Resend, or Firebase — everything lives inside Vercel.

## Getting started

```bash
npm install
npm run icons      # (re)generate PWA icons — already committed
npm run dev
```

Open http://localhost:3000. Note the service worker is disabled in dev (see
`next.config.js`); PWA behaviour is active in production builds.

### Environment variables

Copy `.env.example` to `.env.local` and fill in the values. The Postgres, Blob,
and KV variables are injected automatically when you link those stores to the
project in the Vercel dashboard. You only need to set by hand:

- `AUTH_SECRET` — `openssl rand -base64 32`
- `CRON_SECRET` — any random string; protects the cron endpoint.

The database schema is **created automatically** on first request via
`ensureSchema()` in `lib/db.ts` (idempotent `CREATE TABLE IF NOT EXISTS`).

## Deploying to Vercel

1. Push to GitHub and import the repo in Vercel.
2. In the project, add **Storage → Postgres** and **Storage → Blob** (and
   optionally **KV**). Vercel wires the env vars in automatically.
3. Add `AUTH_SECRET` and `CRON_SECRET` env vars.
4. Deploy. The `vercel.json` cron registers a daily run of
   `/api/cron/recurring` at 06:00 UTC.

## How settle-up works

Each expense records who paid and every participant's exact share (cents are
distributed deterministically so totals always reconcile). Net balance per
member = `paid − owed`, adjusted by recorded settlements. The
`minimizeTransfers` function (`lib/settlement.ts`) then greedily matches the
largest creditor with the largest debtor, producing at most _N − 1_ transfers
for _N_ people.

## Project structure

```
app/
  (auth)/login, (auth)/register     Credentials auth screens
  (app)/home|expenses|settle|stats  The four bottom-nav tabs
  api/                              Route handlers (REST)
components/                         UI + feature components (shadcn/ui in ui/)
lib/                                Domain logic, db, settlement, offline sync
public/                             manifest.json, generated icons, service worker
scripts/generate-icons.mjs         Dependency-free PNG icon generator
```

## License

Free to use. Built to stay free forever.
