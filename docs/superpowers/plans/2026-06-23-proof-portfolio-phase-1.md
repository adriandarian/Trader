# Proof Portfolio Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the seeded local demo with a server-first Proof Portfolio terminal for real market data, persistent cash ledger groundwork, and Overview/Markets/Deposits flows.

**Architecture:** Keep Next App Router pages server-rendered by default and push interactivity into focused client components. Put secrets and provider SDK calls behind `src/lib/market-data/*` and route handlers. Put deterministic accounting and simulation math in pure domain modules with unit tests.

**Tech Stack:** Next.js 16 App Router, React 19.2, TypeScript, Tailwind v4, Drizzle/Postgres for Supabase, Alpaca Market Data over server-side fetch, Vitest for domain tests.

---

### Task 1: Tested Accounting Core

**Files:**
- Create: `src/domain/accounting.test.ts`
- Modify: `src/domain/accounting.ts`
- Modify: `src/domain/types.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import {
  calculateCashBalance,
  calculateTimeWeightedReturn,
  getExecutionPrice,
  summarizeProofPortfolio,
} from "@/domain/accounting";

describe("proof accounting", () => {
  it("keeps deposits out of trading return", () => {
    const summary = summarizeProofPortfolio({
      cashLedgerEntries: [
        { id: "1", type: "deposit", amount: 1000, effectiveAt: "2026-01-01T00:00:00.000Z", sourceLabel: "Paycheck" },
        { id: "2", type: "trade_debit", amount: -400, effectiveAt: "2026-01-02T00:00:00.000Z", sourceLabel: "BUY ABC" },
      ],
      positions: [{ symbol: "ABC", assetType: "stock", quantity: 4, averageEntry: 100, currentMark: 125, openedAt: "2026-01-02" }],
      snapshots: [],
    });

    expect(summary.netContributions).toBe(1000);
    expect(summary.cashAvailable).toBe(600);
    expect(summary.investedMarketValue).toBe(500);
    expect(summary.tradingReturnExcludingDeposits).toBe(100);
  });

  it("uses ask for buys and bid for sells", () => {
    expect(getExecutionPrice({ side: "buy", bid: 101.1, ask: 101.2, last: 101.16 })).toBe(101.2);
    expect(getExecutionPrice({ side: "sell", bid: 101.1, ask: 101.2, last: 101.16 })).toBe(101.1);
  });

  it("calculates cash balance from ledger entries", () => {
    expect(calculateCashBalance([
      { id: "1", type: "deposit", amount: 750, effectiveAt: "2026-01-01T00:00:00.000Z", sourceLabel: "Paycheck" },
      { id: "2", type: "withdrawal", amount: -200, effectiveAt: "2026-01-05T00:00:00.000Z", sourceLabel: "Withdrawal" },
      { id: "3", type: "trade_credit", amount: 55, effectiveAt: "2026-01-08T00:00:00.000Z", sourceLabel: "SELL XYZ" },
    ])).toBe(605);
  });

  it("calculates TWR across dated external cash flows", () => {
    const result = calculateTimeWeightedReturn([
      { capturedAt: "2026-01-01T21:00:00.000Z", totalValue: 1000, externalCashFlow: 0 },
      { capturedAt: "2026-01-02T21:00:00.000Z", totalValue: 1100, externalCashFlow: 0 },
      { capturedAt: "2026-01-03T21:00:00.000Z", totalValue: 1600, externalCashFlow: 500 },
      { capturedAt: "2026-01-04T21:00:00.000Z", totalValue: 1760, externalCashFlow: 0 },
    ]);

    expect(result).toBeCloseTo(21, 5);
  });
});
```

- [ ] **Step 2: Run test and verify missing APIs fail**

Run: `npm test -- --run src/domain/accounting.test.ts`

- [ ] **Step 3: Implement minimal pure accounting APIs**

Create typed ledger, position, snapshot, and quote helpers. Keep browser-only APIs out of domain math.

- [ ] **Step 4: Run tests and verify pass**

Run: `npm test -- --run src/domain/accounting.test.ts`

### Task 2: Server Data Foundation

**Files:**
- Modify: `src/db/schema.ts`
- Create: `drizzle/0001_proof_portfolio_phase_1.sql`
- Create: `src/lib/market-data/types.ts`
- Create: `src/lib/market-data/provider.ts`
- Create: `src/lib/market-data/alpaca.ts`
- Create: `src/lib/market-data/mock.ts`
- Create: `src/app/api/market-data/quote/route.ts`
- Create: `src/app/api/market-data/search/route.ts`

- [ ] **Step 1: Expand schema to requested tables and indexes**
- [ ] **Step 2: Add RLS SQL with `auth.uid()` policies and indexed ownership columns**
- [ ] **Step 3: Add server-only Alpaca provider abstraction**
- [ ] **Step 4: Add route handlers returning safe DTOs and provider error states**

### Task 3: Product Shell and Phase 1 Screens

**Files:**
- Delete: `src/domain/seed.ts`
- Delete: `src/domain/market-data.ts`
- Replace: `src/components/proof-portfolio-app.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/page.tsx`
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Remove localStorage and reset demo path**
- [ ] **Step 2: Build dark terminal shell with left sidebar and top command bar**
- [ ] **Step 3: Implement Overview zero-state proof metrics with honest empty states**
- [ ] **Step 4: Implement Markets quote/search client against route handlers**
- [ ] **Step 5: Implement Deposits & Cash form UI ready for server persistence**

### Task 4: Verification

**Files:**
- Verify all changed files

- [ ] **Step 1: Run `npm test`**
- [ ] **Step 2: Run `npm run lint`**
- [ ] **Step 3: Run `npm run build`**
- [ ] **Step 4: Start dev server and capture desktop/mobile screenshots**
- [ ] **Step 5: Compare screenshots to generated concept with `view_image`**
