import type {
  AuditEvent,
  LedgerEntry,
  PerformancePoint,
  PortfolioSnapshot,
  Position,
  ProofPortfolioState,
  Trade,
} from "@/domain/types";
import { marketDataProvider } from "@/domain/market-data";

const stockMultiplier = 1;
const optionMultiplier = 100;

export function tradeNotional(trade: Pick<Trade, "assetType" | "quantity" | "entryPrice">) {
  return trade.quantity * trade.entryPrice * multiplierFor(trade.assetType);
}

export function exitNotional(trade: Trade) {
  return trade.exitPrice ? trade.quantity * trade.exitPrice * multiplierFor(trade.assetType) : 0;
}

export function multiplierFor(assetType: Trade["assetType"]) {
  return assetType === "option" ? optionMultiplier : stockMultiplier;
}

export function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function percent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function calculatePortfolio(state: ProofPortfolioState): PortfolioSnapshot {
  const cashBalance = state.ledger.reduce((sum, entry) => sum + entry.amount, 0);
  const totalDeposits = state.ledger
    .filter((entry) => entry.type === "deposit")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const totalWithdrawals = Math.abs(
    state.ledger
      .filter((entry) => entry.type === "withdrawal")
      .reduce((sum, entry) => sum + entry.amount, 0),
  );

  const openPositions = buildOpenPositions(state.trades);
  const realizedPnL = calculateRealizedPnL(state.trades);
  const unrealizedPnL = openPositions.reduce((sum, position) => sum + position.unrealizedPnL, 0);
  const investedValue = openPositions.reduce((sum, position) => sum + position.marketValue, 0);
  const totalPortfolioValue = cashBalance + investedValue;
  const netContributions = totalDeposits - totalWithdrawals;
  const tradingReturnExcludingDeposits = totalPortfolioValue - netContributions;
  const accountGrowthIncludingDeposits =
    netContributions > 0 ? ((totalPortfolioValue - netContributions) / netContributions) * 100 : 0;
  const equityCurve = buildEquityCurve(state.ledger, state.trades);
  const closedTrades = state.trades.filter((trade) => trade.status === "closed" && trade.exitPrice);
  const tradePnLs = closedTrades.map((trade) => getTradePnL(trade));
  const wins = tradePnLs.filter((value) => value > 0);
  const losses = tradePnLs.filter((value) => value < 0);
  const bestTrade = closedTrades.toSorted((a, b) => getTradePnL(b) - getTradePnL(a))[0];
  const worstTrade = closedTrades.toSorted((a, b) => getTradePnL(a) - getTradePnL(b))[0];

  return {
    cashBalance,
    totalDeposits,
    totalWithdrawals,
    openPositions,
    realizedPnL,
    unrealizedPnL,
    totalPortfolioValue,
    tradingReturnExcludingDeposits,
    accountGrowthIncludingDeposits,
    equityCurve,
    monthlyPerformance: buildMonthlyPerformance(equityCurve),
    winRate: closedTrades.length ? (wins.length / closedTrades.length) * 100 : 0,
    averageWin: wins.length ? wins.reduce((sum, value) => sum + value, 0) / wins.length : 0,
    averageLoss: losses.length ? losses.reduce((sum, value) => sum + value, 0) / losses.length : 0,
    maxDrawdown: calculateMaxDrawdown(equityCurve.map((point) => point.totalValue)),
    bestTrade,
    worstTrade,
  };
}

export function getTradePnL(trade: Trade) {
  if (!trade.exitPrice) {
    return 0;
  }

  const direction = trade.action === "buy" ? 1 : -1;
  return (trade.exitPrice - trade.entryPrice) * trade.quantity * multiplierFor(trade.assetType) * direction;
}

export function ledgerEntryForTrade(trade: Trade): LedgerEntry {
  const notional = tradeNotional(trade);
  const amount = trade.action === "buy" ? -notional : notional;

  return {
    id: crypto.randomUUID(),
    date: trade.openedAt,
    type: trade.assetType === "option"
      ? trade.action === "buy"
        ? "option_premium_debit"
        : "option_premium_credit"
      : trade.action === "buy"
        ? "stock_buy"
        : "stock_sell",
    amount,
    source: `${trade.action.toUpperCase()} ${trade.ticker}`,
    notes: trade.notes,
    tradeId: trade.id,
  };
}

export function ledgerEntryForClosedTrade(trade: Trade): LedgerEntry | undefined {
  if (!trade.exitPrice || !trade.closedAt) {
    return undefined;
  }

  const proceeds = exitNotional(trade);
  const amount = trade.action === "buy" ? proceeds : -proceeds;

  return {
    id: crypto.randomUUID(),
    date: trade.closedAt,
    type: trade.assetType === "option"
      ? trade.action === "buy"
        ? "option_premium_credit"
        : "option_premium_debit"
      : trade.action === "buy"
        ? "stock_sell"
        : "stock_buy",
    amount,
    source: `CLOSE ${trade.ticker}`,
    notes: `Realized P/L ${currency(getTradePnL(trade))}`,
    tradeId: trade.id,
  };
}

export function auditEvent(
  entityType: AuditEvent["entityType"],
  entityId: string,
  action: AuditEvent["action"],
  summary: string,
): AuditEvent {
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString().slice(0, 10),
    entityType,
    entityId,
    action,
    summary,
  };
}

function buildOpenPositions(trades: Trade[]): Position[] {
  const positions = new Map<string, { trade: Trade; quantity: number; costBasis: number }>();

  for (const trade of trades.filter((item) => item.status === "open")) {
    const key = `${trade.assetType}:${trade.ticker}`;
    const current = positions.get(key) ?? { trade, quantity: 0, costBasis: 0 };
    const signedQuantity = trade.action === "buy" ? trade.quantity : -trade.quantity;
    current.quantity += signedQuantity;
    current.costBasis += signedQuantity * trade.entryPrice * multiplierFor(trade.assetType);
    current.trade = trade;
    positions.set(key, current);
  }

  return Array.from(positions.values())
    .filter((position) => position.quantity !== 0)
    .map(({ trade, quantity, costBasis }) => {
      const quote = marketDataProvider.getQuote(trade.ticker, trade.assetType);
      const marketValue = quantity * quote.price * multiplierFor(trade.assetType);

      return {
        ticker: trade.ticker,
        assetType: trade.assetType,
        quantity,
        averageCost: costBasis / quantity / multiplierFor(trade.assetType),
        marketPrice: quote.price,
        marketValue,
        costBasis,
        unrealizedPnL: marketValue - costBasis,
      };
    });
}

function calculateRealizedPnL(trades: Trade[]) {
  return trades.reduce((sum, trade) => sum + getTradePnL(trade), 0);
}

function buildEquityCurve(ledger: LedgerEntry[], trades: Trade[]): PerformancePoint[] {
  const datedEntries = ledger.toSorted((a, b) => a.date.localeCompare(b.date));
  const uniqueDates = Array.from(new Set(datedEntries.map((entry) => entry.date)));

  if (!uniqueDates.length) {
    return [];
  }

  return uniqueDates.map((date) => {
    const ledgerToDate = datedEntries.filter((entry) => entry.date <= date);
    const tradesToDate = trades.filter((trade) => trade.openedAt <= date);
    const cash = ledgerToDate.reduce((sum, entry) => sum + entry.amount, 0);
    const positions = buildOpenPositions(tradesToDate.filter((trade) => trade.status === "open" || !trade.closedAt || trade.closedAt > date));
    const investedValue = positions.reduce((sum, position) => sum + position.marketValue, 0);
    const totalDeposits = ledgerToDate
      .filter((entry) => entry.type === "deposit")
      .reduce((sum, entry) => sum + entry.amount, 0);
    const withdrawals = Math.abs(
      ledgerToDate
        .filter((entry) => entry.type === "withdrawal")
        .reduce((sum, entry) => sum + entry.amount, 0),
    );
    const totalValue = cash + investedValue;
    const contributions = totalDeposits - withdrawals;

    return {
      date,
      cash,
      investedValue,
      totalValue,
      totalDeposits,
      tradingReturn: totalValue - contributions,
      accountGrowth: contributions > 0 ? ((totalValue - contributions) / contributions) * 100 : 0,
    };
  });
}

function buildMonthlyPerformance(points: PerformancePoint[]) {
  const byMonth = new Map<string, PerformancePoint>();

  for (const point of points) {
    byMonth.set(point.date.slice(0, 7), point);
  }

  return Array.from(byMonth.entries()).map(([month, point]) => ({
    month,
    tradingReturn: point.tradingReturn,
    accountGrowth: point.accountGrowth,
  }));
}

function calculateMaxDrawdown(values: number[]) {
  let peak = values[0] ?? 0;
  let maxDrawdown = 0;

  for (const value of values) {
    peak = Math.max(peak, value);
    if (peak > 0) {
      maxDrawdown = Math.max(maxDrawdown, ((peak - value) / peak) * 100);
    }
  }

  return maxDrawdown;
}
