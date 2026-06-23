# Proof Portfolio

Proof Portfolio is a personal paper-trading terminal for proving whether trading performance is real after separating external contributions from trading profit and loss.

The app is intentionally strict:

- No seeded portfolio data.
- No localStorage as source of truth.
- No fake prices or fabricated charts.
- Market prices are displayed only from server-side market-data provider responses.
- Alpaca is read-only market data only. The app never calls Alpaca order, account, funding, transfer, or position endpoints.
- Deposits and withdrawals are external cash flows, not trading P/L.
- Closed trade history is designed to be immutable and corrected through adjustment events.

## Setup

### 1. Supabase setup

Create a Supabase project and copy the pooled Postgres connection string into:

```bash
DATABASE_URL="postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres"
```

The schema is designed around Supabase Auth ownership. `profiles.id` and `accounts.user_id` reference `auth.users.id`, and account-owned tables use RLS policies that compare ownership to `auth.uid()`.

### 2. SQL migrations

Run the existing Drizzle migrations against the Supabase database:

```bash
npm run db:migrate
```

If you prefer to apply SQL manually, run:

```bash
drizzle/0000_useful_rogue.sql
drizzle/0001_proof_portfolio_phase_1.sql
```

`0001_proof_portfolio_phase_1.sql` adds the Phase 1 tables, indexes, and RLS policies:

- `profiles`
- `accounts`
- `cash_ledger_entries`
- `instruments`
- `orders`
- `fills`
- `positions`
- `journal_entries`
- `portfolio_snapshots`
- `audit_events`
- `watchlist_items`

### 3. Alpaca API key configuration

Create Alpaca paper-trading API keys and set:

```bash
ALPACA_API_KEY="..."
ALPACA_API_SECRET="..."
MARKET_DATA_PROVIDER="alpaca"
ALPACA_STOCK_FEED="iex"
ALPACA_OPTION_FEED="indicative"
```

The first provider implementation uses the free Alpaca Basic tier from server-only route handlers:

- Stock/ETF quotes and bars use `feed=iex` and are labeled `IEX real-time`.
- Free options snapshots use `feed=indicative` and are labeled `Indicative options feed`.
- Market clock/status and last-updated timestamps are surfaced wherever quotes are displayed.
- Symbol discovery, market clock, and option contracts use Alpaca's documented read-only metadata endpoints. A code-level allowlist blocks account, order, funding, transfer, position, watchlist, and portfolio endpoints before any `fetch` is attempted.

Supabase is the only source of truth for simulated cash, paper orders, simulated fills, positions, cost basis, portfolio value, journal entries, audit events, and performance calculations.

### 4. Vercel environment variables

Configure these in Vercel Project Settings:

```bash
DATABASE_URL
ALPACA_API_KEY
ALPACA_API_SECRET
MARKET_DATA_PROVIDER
ALPACA_STOCK_FEED
ALPACA_OPTION_FEED
```

Do not prefix Alpaca or database secrets with `NEXT_PUBLIC_`.

### 5. Local development commands

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
```

## Current Phase

Implemented:

- Dark desktop-first terminal shell with fixed sidebar and compact command bar.
- Overview proof screen with empty/zero states that do not invent performance.
- Markets quote/search panel wired through server-side API routes.
- Alpaca provider abstraction under `src/lib/market-data`.
- Supabase/Drizzle schema and RLS migration foundation.
- Unit tests for cash ledger math, bid/ask execution price logic, contribution separation, and time-weighted return.

Known limitations:

- Supabase Auth UI and account selection are not wired yet, so the deposit form does not post records. It is intentionally disabled rather than writing to localStorage.
- Portfolio holdings, order execution, fills, and snapshots are schema-backed but not yet connected to authenticated server actions.
- Options UI is not exposed yet. Provider methods exist for contract lookup and snapshots, but the first visible workflow is stock quote discovery.
- The mock provider exists only as an explicit `MARKET_DATA_PROVIDER=mock` development fallback and does not return prices. Nothing displayed in the default app is mocked.
