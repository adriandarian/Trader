import Link from "next/link";

import { summarizeProofPortfolio } from "@/domain/accounting";

import { fixtureCashLedger, fixturePositions, fixtureSnapshots, fixtureTrades } from "../design-fixtures";
import { currency, percent, signedCurrency, valueTone } from "../format";
import { ChartFrame, EmptyState, MetricCard, MiniBars, SegmentedControl, TableShell, TerminalPanel } from "../terminal-ui";

export function OverviewPage({ fixture }: { fixture: boolean }) {
  const summary = summarizeProofPortfolio(
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

  const metrics = [
    { label: "Total Portfolio Value", value: currency(summary.totalPortfolioValue), support: fixture ? "+7.94% all time" : "$0.00 (0.00%)", tone: valueTone(summary.totalPortfolioValue) },
    { label: "Cash Available", value: currency(summary.cashAvailable), tone: "neutral" },
    { label: "Invested Market Value", value: currency(summary.investedMarketValue), tone: "neutral" },
    { label: "Today's P/L", value: signedCurrency(summary.todayPnl), support: percent(summary.todayPnl), tone: valueTone(summary.todayPnl) },
    { label: "Total Realized P/L", value: signedCurrency(summary.totalRealizedPnl), support: percent(summary.totalRealizedPnl), tone: valueTone(summary.totalRealizedPnl) },
    { label: "Total Unrealized P/L", value: signedCurrency(summary.totalUnrealizedPnl), support: percent(summary.totalUnrealizedPnl), tone: valueTone(summary.totalUnrealizedPnl) },
    { label: "Net Contributions", value: currency(summary.netContributions), tone: "neutral" },
    { label: "Trading Return", value: fixture ? "+$1,095.62" : "$0.00", support: "Excluding deposits", tone: fixture ? "positive" : "neutral", info: true },
    { label: "Time-Weighted Return", value: percent(summary.timeWeightedReturn).replace("+", ""), tone: valueTone(summary.timeWeightedReturn), info: true },
    { label: "Benchmark (vs SPY)", value: percent(summary.benchmarkReturn).replace("+", ""), tone: valueTone(summary.benchmarkReturn), info: true },
  ] as const;

  return (
    <div className="mx-auto flex min-h-full max-w-[980px] flex-col" data-testid="route-content">
      <h1 className="mb-2 text-[22px] font-semibold tracking-[-0.02em] text-white">Overview</h1>

      <div className="grid grid-cols-2 gap-[10px] xl:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <TerminalPanel
        title="Portfolio Equity Curve"
        action={<SegmentedControl options={["1W", "1M", "3M", "YTD", "All"]} value="All" />}
        className="mt-[10px]"
      >
        <ChartFrame>
          {fixture ? (
            <>
              <div className="absolute inset-x-[70px] bottom-[58px] h-[62px] border-l-2 border-t-2 border-[#4ea3ff]" />
              <div className="absolute inset-x-[160px] bottom-[74px] h-[74px] border-l-2 border-t-2 border-[#9b7cff]" />
              <MiniBars values={[20, 34, 28, 45, 52, 64, 71, 82, 78, 88, 95, 104]} />
            </>
          ) : (
            <EmptyState
              icon="chart"
              title="No data to display."
              body="Make a deposit or place a trade to see contribution-adjusted portfolio performance over time."
            />
          )}
        </ChartFrame>
      </TerminalPanel>

      <div className="mt-[10px] grid min-h-[310px] flex-1 grid-cols-[minmax(0,1.35fr)_minmax(260px,0.85fr)] gap-[10px]">
        <TerminalPanel title="Recent Trades" action={<Link className="text-[12px] text-[#4ea3ff]" href="/journal">View journal</Link>}>
          {fixture ? (
            <TableShell
              columns={["Time", "Symbol", "Side", "Quantity", "Type", "Price", "Status"]}
              rows={fixtureTrades.map((trade) => (
                <tr key={`${trade.time}-${trade.symbol}`} className="h-10 border-b border-[#67809622] text-[#d7e0eb]">
                  <td className="px-3 font-mono">{trade.time}</td>
                  <td className="px-3 font-mono text-white">{trade.symbol}</td>
                  <td className="px-3">{trade.side}</td>
                  <td className="px-3 font-mono">{trade.quantity}</td>
                  <td className="px-3">{trade.type}</td>
                  <td className="px-3 font-mono">{trade.price}</td>
                  <td className="px-3">{trade.status}</td>
                </tr>
              ))}
            />
          ) : (
            <EmptyState title="No trades yet" body="Your recent trade activity will appear here after order execution is enabled and a signed-in session records trades." />
          )}
        </TerminalPanel>

        <TerminalPanel title="Proof Scorecard" action={<Link className="text-[12px] text-[#4ea3ff]" href="/performance">Details</Link>}>
          <div className="p-3">
            {[
              ["Total Trades", fixture ? "3" : "0"],
              ["Win Rate", fixture ? "66.67%" : "0.00%"],
              ["Profit Factor", fixture ? "1.84" : "0.00"],
              ["Avg Win", fixture ? "$397.16" : "$0.00"],
              ["Avg Loss", fixture ? "$85.00" : "$0.00"],
              ["Expectancy per Trade", fixture ? "$236.44" : "$0.00"],
              ["Max Drawdown", fixture ? "-2.15%" : "0.00%"],
              ["Best Day", fixture ? "+$318.24" : "$0.00"],
              ["Worst Day", fixture ? "-$104.18" : "$0.00"],
            ].map(([label, value]) => (
              <div key={label} className="flex h-[31px] items-center justify-between border-b border-[#67809626] bg-[#111922] px-3 text-[12px] last:border-0">
                <span className="text-[#b9c4d1]">{label}</span>
                <span className="font-mono text-white">{value}</span>
              </div>
            ))}
          </div>
        </TerminalPanel>
      </div>
    </div>
  );
}
