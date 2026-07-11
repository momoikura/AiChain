# Crypto Sentinel AI

> Institutional-grade crypto intelligence terminal. Fuses on-chain, market, DeFi,
> developer, governance, news and social signals into **transparent, explainable,
> probability-based** risk scores — never predictions, never from a single source.

A Bloomberg/Arkham/Nansen-inspired dashboard built with **Next.js 14 (App Router) +
TypeScript + Tailwind CSS**. Dark-mode, glassmorphic, real-time, **mobile-first**.

### Runs at $0 — no paid API required

The whole app runs for free on the built-in simulated feed. To go live at **no cost**, the
registry marks every provider **Free** (keyless/public: CoinGecko, Etherscan, DexScreener,
GitHub, DeFiLlama, Binance/Bybit/OKX public endpoints, RSS news…), **Freemium**, or **Paid**.
The paid intelligence tools (Nansen, Glassnode…) are entirely optional — everything works
without them. See the **Data Sources** page for the full breakdown.

### Meme-coin intelligence

A dedicated **Meme Radar** (`/memes`) plus meme-native detectors: social surge, KOL/influencer
posts, holder-growth spikes, smart-money aping, DEX volume surges, LP locks, bonding-curve
(pump.fun) graduations, sniper clusters and supply concentration. Meme coins (WIF, PEPE, BONK,
POPCAT, BRETT, MEW, FLOKI, SHIB, TURBO, MOG) carry the same guardrail as everything else:
**no alert ever fires from social buzz alone** — on-chain corroboration is always required.

### Mobile-optimized

Fixed bottom tab bar for phones/tablets (the desktop sidebar hides below `lg`), iOS safe-area
insets, responsive viewport, adaptive sub-cent price formatting, and single-column reflow of
every grid and table.

### Backend & auth — Supabase

Auth and user data are backed by **Supabase** (Postgres + Auth + RLS). The free tier keeps it
**$0**. Full setup is in [`supabase/SETUP.md`](supabase/SETUP.md); schema in
[`supabase/schema.sql`](supabase/schema.sql).

- **Supabase Auth** for accounts/sessions — login/signup/logout via route handlers
  (`app/api/auth/*`) using `@supabase/ssr` cookie sessions. Same glassmorphic screens.
- **Route protection** in `middleware.ts` → `lib/supabase/middleware.ts` (refreshes the session
  and redirects unauthenticated users to `/login`); the `(app)` layout re-verifies server-side.
- **User data in Postgres with Row-Level Security** (each user sees only their own rows):
  `profiles` (auto-created on signup via trigger), `watchlist`, `trading_rules`, `trades`,
  `notification_settings`, and `exchange_keys` — the last stores API keys **AES-256-GCM encrypted
  app-side** (`lib/server/crypto.ts`); plaintext never reaches the DB.
- **Data-access layer** in `lib/server/db/*` + **server actions** wire it to the UI: the Automation
  page loads/persists trading rules (seeding defaults on first use); Settings persists notification
  prefs and encrypted exchange keys.
- **Preview mode:** until you add keys, the app runs **without** auth/persistence (a banner says so
  and pages fall back to in-memory fixtures) so it's usable during setup. The moment
  `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` are present, real auth + persistence
  turn on automatically.

Env vars: copy [`.env.example`](.env.example) → `.env.local`. Routes are split into two groups:
`app/(app)/*` (authenticated, has the sidebar/topbar chrome) and `app/(auth)/*` (login/signup).

> **Do you need a backend?** For the simulated demo, no. For the real product — accounts, encrypted
> exchange keys, 2FA, audit logs, per-user portfolios, trade execution — yes. Supabase is now that
> backend.

---

## What this build is (and isn't)

This is a **fully runnable v1 foundation**. The intelligence engine, scoring, alerting,
explainable-AI breakdowns, portfolio analytics and automation UI are all real and working.

The 38 external providers (Nansen, Arkham, Glassnode, Binance, GitHub, …) are **paid APIs
requiring keys and legal agreements**, so they are **simulated behind live-ready adapters**.
Every provider is clearly labelled `Simulated` in the Data Sources view. Wiring a real key
flips a source to `Live` **without touching the engine or UI** — that's the whole point of
the adapter seam (`lib/sources/registry.ts`).

- The simulated feed is **deterministic per minute-tick**, so server and client render
  identically (no hydration mismatch) while still evolving over time to feel live.
- **No real trades are executed.** Automation runs in paper mode; there is a global
  emergency stop and a volatility circuit breaker.
- This is **decision-support software, not financial advice.**

---

## Quick start

```bash
cd crypto-sentinel-ai
npm install
npm run dev
# open http://localhost:3000
```

Other scripts:

```bash
npm run build       # production build
npm run start       # serve the production build
npm run typecheck   # tsc --noEmit
```

---

## Architecture

```
app/                      Next.js routes (server components → client views)
  page.tsx                Command Center (dashboard)
  signals/                Signal feed with filters
  tokens/ , tokens/[symbol]/   Universe table + explainable token dossier
  portfolio/              PnL, Sharpe, drawdown, AI decision log
  automation/             Rule builder, risk limits, emergency stop
  sources/                All 38 providers + reliability
  settings/               Security, exchange keys, notifications

components/               UI (glass primitives, custom SVG charts, views)
lib/
  types.ts                Domain contract shared by data ↔ engine ↔ UI
  sources/registry.ts     SourceAdapter interface + provider catalogue  ← live-API seam
  data/universe.ts        Simulated signal + market feed (deterministic)
  data/store.ts           Facade: feed → engine for a given tick
  engine/score.ts         Multi-stage confidence engine + alert construction
  hooks/useLive.ts        Client subscription (swap for WebSocket/SSE in prod)
```

### The intelligence engine (`lib/engine/score.ts`)

For each token the engine scores bullish and bearish theses independently, fusing six
weighted components into a single 0–100 confidence:

| Component | Weight | Meaning |
|---|---|---|
| Corroboration | 28% | Distinct **independent** source categories agreeing |
| On-chain confirmation | 22% | Share of the thesis backed by hard chain events |
| Source reliability | 16% | Historical quality of the contributing sources |
| Statistical anomaly | 14% | How far the evidence deviates from baseline (z-score) |
| Evidence freshness | 8% | Exponential recency decay (~6h half-life) |
| Historical accuracy | 12% | How similar past setups resolved |

**Guardrails baked in:**

1. **No single-source alerts.** Corroboration across independent categories is mandatory.
2. **Social can never trigger an alert alone** — social-only theses are hard-capped at 34.
3. **Contradicting evidence is surfaced and subtracts from the score.**
4. Everything decomposes into inspectable factors for the UI (see any alert → *Explain*).

Alert levels: **Green** (possible accumulation) · **Yellow** (high-probability move) ·
**Red** (high-risk volatility / sell pressure). Every alert ships with supporting evidence,
contradicting evidence, historical analogs, and an explicit risks/uncertainties list.

---

## Going to production

- **Live data:** implement `SourceAdapter` per provider (real fetch + normalize) and set
  `live: true` in the registry. No engine/UI changes required.
- **Real-time transport:** replace `useLiveSnapshot`'s interval with a WebSocket/SSE feed.
- **Persistence & scale:** the spec targets PostgreSQL + Redis + Kafka + background workers;
  this repo is the presentation + intelligence layer that sits on top of that pipeline.
- **Trading:** integrate official exchange APIs (Binance/Bybit/OKX/Coinbase Advanced) behind
  an execution service that honours the per-rule risk limits, confidence gate, cooldowns,
  circuit breaker and emergency stop already modelled in the Automation view.

---

## Disclaimer

Crypto Sentinel AI produces probabilistic, evidence-based assessments. It does **not**
predict the future and does **not** constitute financial advice. You are responsible for
your own trading decisions and risk management.
