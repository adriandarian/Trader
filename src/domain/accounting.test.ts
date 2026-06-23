import { describe, expect, it } from "vitest";

import {
  calculateCashBalance,
  calculateTimeWeightedReturn,
  getExecutionPrice,
  summarizeProofPortfolio,
} from "./accounting";

describe("proof accounting", () => {
  it("keeps deposits out of trading return", () => {
    const summary = summarizeProofPortfolio({
      cashLedgerEntries: [
        {
          id: "1",
          type: "deposit",
          amount: 1000,
          effectiveAt: "2026-01-01T00:00:00.000Z",
          sourceLabel: "Paycheck",
        },
        {
          id: "2",
          type: "trade_debit",
          amount: -400,
          effectiveAt: "2026-01-02T00:00:00.000Z",
          sourceLabel: "BUY ABC",
        },
      ],
      positions: [
        {
          symbol: "ABC",
          assetType: "stock",
          quantity: 4,
          averageEntry: 100,
          currentMark: 125,
          openedAt: "2026-01-02",
        },
      ],
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
    expect(
      calculateCashBalance([
        {
          id: "1",
          type: "deposit",
          amount: 750,
          effectiveAt: "2026-01-01T00:00:00.000Z",
          sourceLabel: "Paycheck",
        },
        {
          id: "2",
          type: "withdrawal",
          amount: -200,
          effectiveAt: "2026-01-05T00:00:00.000Z",
          sourceLabel: "Withdrawal",
        },
        {
          id: "3",
          type: "trade_credit",
          amount: 55,
          effectiveAt: "2026-01-08T00:00:00.000Z",
          sourceLabel: "SELL XYZ",
        },
      ]),
    ).toBe(605);
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
