# Supabase setup (free tier — $0)

The app runs in **preview mode** (no login, no persistence) until you complete
these steps. Once done, real Supabase Auth + data persistence turn on
automatically.

## 1. Create a project
1. Go to <https://supabase.com> → **New project** (the free tier is enough).
2. Pick a name + database password, wait ~1 min for it to provision.

## 2. Grab your keys
**Project Settings → API**:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** secret → `SUPABASE_SERVICE_ROLE_KEY` (server-only)

Copy `.env.example` → `.env.local` and paste them in. Also set a strong
`APIKEY_ENC_SECRET` (`openssl rand -hex 32`).

## 3. Create the tables
**SQL Editor → New query** → paste all of [`schema.sql`](./schema.sql) → **Run**.
This creates the user-owned tables (`profiles`, `watchlist`, `trading_rules`,
`trades`, `notification_settings`, `exchange_keys`), the signup→profile trigger,
and Row-Level Security so users only ever see their own data.

## 4. (Recommended for the demo) Instant signups
**Authentication → Providers → Email** → turn **off** "Confirm email" so new
accounts can sign in immediately. Leave it on for production and users will get
a confirmation email instead.

## 5. Run it
```bash
npm run dev
```
Sign up at `/signup` — a `profiles` row and default trading rules are created
automatically on first use.

---

### What lives in Supabase
| Data | Table |
|------|-------|
| Accounts & sessions | Supabase Auth (`auth.users`) |
| Profile (name, email) | `profiles` (auto-created via trigger) |
| Watchlist | `watchlist` |
| Trading rules | `trading_rules` |
| Paper/live trades | `trades` |
| Notification prefs | `notification_settings` |
| Exchange API keys (encrypted) | `exchange_keys` |

The market/signal feed stays computed in the app (simulated now, live adapters
later) rather than stored — see the main README.
