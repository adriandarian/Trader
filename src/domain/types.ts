export type LedgerEntryType =
  | "deposit"
  | "withdrawal"
  | "stock_buy"
  | "stock_sell"
  | "option_premium_debit"
  | "option_premium_credit"
  | "fee";

export type AssetType = "stock" | "option";
export type TradeAction = "buy" | "sell";
export type TradeStatus = "open" | "closed";
export type OptionType = "call" | "put";

export type LedgerEntry = {
  id: string;
  date: string;
  type: LedgerEntryType;
  amount: number;
  source: string;
  notes?: string;
  tradeId?: string;
};

export type Trade = {
  id: string;
  ticker: string;
  assetType: AssetType;
  action: TradeAction;
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  openedAt: string;
  closedAt?: string;
  thesis: string;
  strategy: string;
  riskAmount: number;
  target: number;
  stopLoss: number;
  notes?: string;
  status: TradeStatus;
  underlyingTicker?: string;
  optionType?: OptionType;
  strike?: number;
  expirationDate?: string;
  premium?: number;
  contracts?: number;
  strategyTag?: string;
  maxLoss?: number;
  maxProfit?: number;
  greeks?: {
    delta?: number;
    gamma?: number;
    theta?: number;
    vega?: number;
  };
};

export type AuditEvent = {
  id: string;
  date: string;
  entityType: "trade" | "ledger";
  entityId: string;
  action: "created" | "closed" | "ledger_posted";
  summary: string;
};

export type Position = {
  ticker: string;
  assetType: AssetType;
  quantity: number;
  averageCost: number;
  marketPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnL: number;
};

export type PerformancePoint = {
  date: string;
  cash: number;
  investedValue: number;
  totalValue: number;
  totalDeposits: number;
  tradingReturn: number;
  accountGrowth: number;
};

export type PortfolioSnapshot = {
  cashBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  openPositions: Position[];
  realizedPnL: number;
  unrealizedPnL: number;
  totalPortfolioValue: number;
  tradingReturnExcludingDeposits: number;
  accountGrowthIncludingDeposits: number;
  equityCurve: PerformancePoint[];
  monthlyPerformance: Array<{
    month: string;
    tradingReturn: number;
    accountGrowth: number;
  }>;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  maxDrawdown: number;
  bestTrade?: Trade;
  worstTrade?: Trade;
};

export type ProofPortfolioState = {
  ledger: LedgerEntry[];
  trades: Trade[];
  auditLog: AuditEvent[];
};
