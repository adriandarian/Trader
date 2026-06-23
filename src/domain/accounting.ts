import type {
  AssetType,
  CashLedgerEntry,
  MarkedPosition,
  PortfolioSnapshotPoint,
  ProofPortfolioInput,
  ProofPortfolioSummary,
  QuoteForExecution,
} from "./types";

const optionMultiplier = 100;

export function multiplierFor(assetType: AssetType, explicitMultiplier?: number) {
  if (explicitMultiplier) {
    return explicitMultiplier;
  }

  return assetType === "option" ? optionMultiplier : 1;
}

export function calculateCashBalance(entries: CashLedgerEntry[]) {
  return roundMoney(entries.reduce((sum, entry) => sum + entry.amount, 0));
}

export function calculateNetContributions(entries: CashLedgerEntry[]) {
  return roundMoney(
    entries
      .filter((entry) => entry.type === "deposit" || entry.type === "withdrawal")
      .reduce((sum, entry) => sum + entry.amount, 0),
  );
}

export function calculateInvestedMarketValue(positions: MarkedPosition[]) {
  return roundMoney(
    positions.reduce(
      (sum, position) =>
        sum + position.quantity * position.currentMark * multiplierFor(position.assetType, position.multiplier),
      0,
    ),
  );
}

export function calculateUnrealizedPnl(positions: MarkedPosition[]) {
  return roundMoney(
    positions.reduce((sum, position) => {
      const multiplier = multiplierFor(position.assetType, position.multiplier);
      return sum + position.quantity * (position.currentMark - position.averageEntry) * multiplier;
    }, 0),
  );
}

export function summarizeProofPortfolio(input: ProofPortfolioInput): ProofPortfolioSummary {
  const cashAvailable = calculateCashBalance(input.cashLedgerEntries);
  const investedMarketValue = calculateInvestedMarketValue(input.positions);
  const netContributions = calculateNetContributions(input.cashLedgerEntries);
  const totalPortfolioValue = roundMoney(cashAvailable + investedMarketValue);
  const totalUnrealizedPnl = calculateUnrealizedPnl(input.positions);

  return {
    totalPortfolioValue,
    cashAvailable,
    investedMarketValue,
    todayPnl: roundMoney(input.todayPnl ?? 0),
    totalRealizedPnl: roundMoney(input.realizedPnl ?? 0),
    totalUnrealizedPnl,
    netContributions,
    tradingReturnExcludingDeposits: roundMoney(totalPortfolioValue - netContributions),
    timeWeightedReturn: calculateTimeWeightedReturn(input.snapshots),
    benchmarkReturn: roundPercent(input.benchmarkReturn ?? 0),
  };
}

export function getExecutionPrice(quote: QuoteForExecution) {
  const selected = quote.side === "buy" ? quote.ask : quote.bid;

  if (selected === null || selected === undefined || selected <= 0) {
    throw new Error(`Cannot simulate ${quote.side} execution without a valid ${quote.side === "buy" ? "ask" : "bid"}.`);
  }

  return selected;
}

export function isLimitOrderMarketable(input: {
  side: "buy" | "sell";
  limitPrice: number;
  bid: number | null;
  ask: number | null;
}) {
  if (input.side === "buy") {
    return input.ask !== null && input.ask !== undefined && input.limitPrice >= input.ask;
  }

  return input.bid !== null && input.bid !== undefined && input.limitPrice <= input.bid;
}

export function calculateTimeWeightedReturn(points: PortfolioSnapshotPoint[]) {
  const sorted = points
    .filter((point) => Number.isFinite(point.totalValue))
    .toSorted((a, b) => a.capturedAt.localeCompare(b.capturedAt));

  if (sorted.length < 2) {
    return 0;
  }

  let compounded = 1;

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];

    if (!previous || !current || previous.totalValue <= 0) {
      continue;
    }

    const adjustedEndingValue = current.totalValue - current.externalCashFlow;
    compounded *= adjustedEndingValue / previous.totalValue;
  }

  return roundPercent((compounded - 1) * 100);
}

export function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function signedCurrency(value: number) {
  const formatted = currency(Math.abs(value));
  return `${value >= 0 ? "+" : "-"}${formatted}`;
}

export function percent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundPercent(value: number) {
  return Math.round((value + Number.EPSILON) * 100000) / 100000;
}
