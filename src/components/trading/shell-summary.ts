import { summarizeProofPortfolio } from "@/domain/accounting";

import { fixtureCashLedger, fixturePositions, fixtureSnapshots } from "./design-fixtures";

export function getShellSummary(fixture: boolean) {
  return summarizeProofPortfolio(
    fixture
      ? {
          cashLedgerEntries: fixtureCashLedger,
          positions: fixturePositions,
          snapshots: fixtureSnapshots,
          benchmarkReturn: 4.82,
          todayPnl: 128.45,
          realizedPnl: 186.2,
        }
      : {
          cashLedgerEntries: [],
          positions: [],
          snapshots: [],
        },
  );
}
