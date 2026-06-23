import type { CashLedgerEntry, MarkedPosition, PortfolioSnapshotPoint } from "@/domain/types";

export const DESIGN_FIXTURE_QUERY = "__fixture";
export const DESIGN_FIXTURE_VALUE = "design";
export const DESIGN_FIXTURE_WATERMARK = "DESIGN FIXTURE - NOT RUNTIME DATA";

export type DesignFixtureQuote = {
  symbol: string;
  name: string;
  last: number;
  change: number;
  changePercent: number;
  bid: number;
  ask: number;
  volume: number;
  timestamp: string;
  source: string;
};

export const fixtureQuote: DesignFixtureQuote = {
  symbol: "NVDA",
  name: "NVIDIA Corporation",
  last: 142.68,
  change: 2.14,
  changePercent: 1.52,
  bid: 142.62,
  ask: 142.71,
  volume: 48291344,
  timestamp: "2026-06-23T16:12:08.000Z",
  source: "Alpaca IEX fixture",
};

export const fixturePositions: MarkedPosition[] = [
  {
    symbol: "SPY",
    assetType: "stock",
    quantity: 12,
    averageEntry: 514.22,
    currentMark: 548.91,
    openedAt: "2026-03-04T17:30:00.000Z",
  },
  {
    symbol: "NVDA",
    assetType: "stock",
    quantity: 18,
    averageEntry: 126.4,
    currentMark: 142.68,
    openedAt: "2026-04-12T15:18:00.000Z",
  },
  {
    symbol: "AAPL",
    assetType: "option",
    quantity: 1,
    averageEntry: 4.25,
    currentMark: 5.1,
    openedAt: "2026-06-03T15:18:00.000Z",
    expirationDate: "2026-08-21",
    multiplier: 100,
  },
];

export const fixtureCashLedger: CashLedgerEntry[] = [
  {
    id: "cash-1",
    type: "deposit",
    amount: 10000,
    effectiveAt: "2026-01-03T18:00:00.000Z",
    sourceLabel: "Bank Transfer",
    note: "Initial paper portfolio capital.",
  },
  {
    id: "cash-2",
    type: "deposit",
    amount: 1200,
    effectiveAt: "2026-02-01T18:00:00.000Z",
    sourceLabel: "Monthly Contribution",
    note: "February contribution.",
  },
  {
    id: "cash-3",
    type: "trade_debit",
    amount: -6170.64,
    effectiveAt: "2026-03-04T17:30:00.000Z",
    sourceLabel: "Trade Fill",
    note: "SPY long entry.",
    linkedTradeId: "trade-1",
  },
  {
    id: "cash-4",
    type: "trade_debit",
    amount: -2275.2,
    effectiveAt: "2026-04-12T15:18:00.000Z",
    sourceLabel: "Trade Fill",
    note: "NVDA momentum entry.",
    linkedTradeId: "trade-2",
  },
  {
    id: "cash-5",
    type: "deposit",
    amount: 800,
    effectiveAt: "2026-06-01T18:00:00.000Z",
    sourceLabel: "Manual Deposit",
    note: "June contribution.",
  },
];

export const fixtureSnapshots: PortfolioSnapshotPoint[] = [
  { capturedAt: "2026-01-01", totalValue: 10000, externalCashFlow: 10000 },
  { capturedAt: "2026-02-01", totalValue: 11360, externalCashFlow: 1200 },
  { capturedAt: "2026-03-01", totalValue: 11680, externalCashFlow: 0 },
  { capturedAt: "2026-04-01", totalValue: 12140, externalCashFlow: 0 },
  { capturedAt: "2026-05-01", totalValue: 12720, externalCashFlow: 0 },
  { capturedAt: "2026-06-01", totalValue: 14090, externalCashFlow: 800 },
];

export const fixtureTrades = [
  {
    time: "09:44",
    symbol: "NVDA",
    side: "Buy",
    quantity: "18",
    type: "Stock",
    price: "$126.40",
    status: "Open",
    thesis: "AI infrastructure momentum held above prior resistance.",
    risk: "$420 max risk",
    result: "+$293.04 unrealized",
  },
  {
    time: "10:12",
    symbol: "SPY",
    side: "Buy",
    quantity: "12",
    type: "Stock",
    price: "$514.22",
    status: "Open",
    thesis: "Broad-market trend continuation with defined invalidation.",
    risk: "$310 max risk",
    result: "+$416.28 unrealized",
  },
  {
    time: "14:06",
    symbol: "AAPL",
    side: "Buy",
    quantity: "1",
    type: "Option",
    price: "$4.25",
    status: "Open",
    thesis: "Options swing using limited premium risk.",
    risk: "$425 max risk",
    result: "+$85.00 unrealized",
  },
];

export function isDesignFixture(value: string | string[] | undefined) {
  return value === DESIGN_FIXTURE_VALUE || (Array.isArray(value) && value.includes(DESIGN_FIXTURE_VALUE));
}
