export type AssetType = "stock" | "option";
export type OrderSide = "buy" | "sell";
export type OrderType = "market" | "limit";
export type LedgerEntryType =
  | "deposit"
  | "withdrawal"
  | "trade_debit"
  | "trade_credit"
  | "dividend"
  | "option_premium"
  | "fee"
  | "adjustment";

export type CashLedgerEntry = {
  id: string;
  type: LedgerEntryType;
  amount: number;
  effectiveAt: string;
  sourceLabel: string;
  note?: string;
  linkedTradeId?: string;
};

export type MarkedPosition = {
  symbol: string;
  assetType: AssetType;
  quantity: number;
  averageEntry: number;
  currentMark: number;
  openedAt: string;
  expirationDate?: string;
  multiplier?: number;
};

export type PortfolioSnapshotPoint = {
  capturedAt: string;
  totalValue: number;
  externalCashFlow: number;
};

export type ProofPortfolioInput = {
  cashLedgerEntries: CashLedgerEntry[];
  positions: MarkedPosition[];
  snapshots: PortfolioSnapshotPoint[];
  benchmarkReturn?: number;
  todayPnl?: number;
  realizedPnl?: number;
};

export type ProofPortfolioSummary = {
  totalPortfolioValue: number;
  cashAvailable: number;
  investedMarketValue: number;
  todayPnl: number;
  totalRealizedPnl: number;
  totalUnrealizedPnl: number;
  netContributions: number;
  tradingReturnExcludingDeposits: number;
  timeWeightedReturn: number;
  benchmarkReturn: number;
};

export type QuoteForExecution = {
  side: OrderSide;
  bid: number | null;
  ask: number | null;
  last?: number | null;
};
