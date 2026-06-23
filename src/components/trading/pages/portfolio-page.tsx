import Link from "next/link";

import { fixturePositions } from "../design-fixtures";
import { currency, percent, signedCurrency } from "../format";
import { EmptyState, MetricCard, TableShell, TerminalPanel } from "../terminal-ui";

export function PortfolioPage({ fixture }: { fixture: boolean }) {
  const positions = fixture ? fixturePositions : [];
  const totalValue = positions.reduce((sum, position) => sum + position.quantity * position.currentMark * (position.multiplier ?? 1), 0);

  return (
    <div className="mx-auto min-h-full max-w-[1180px]" data-testid="route-content">
      <h1 className="mb-2 text-[22px] font-semibold tracking-[-0.02em] text-white">Portfolio</h1>
      <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-[10px]">
        <div className="space-y-[10px]">
          <TerminalPanel title="Holdings">
            {positions.length ? (
              <TableShell
                columns={["Symbol", "Asset Type", "Quantity", "Average Entry", "Current Mark", "Market Value", "Today P/L", "Total P/L", "Weight"]}
                rows={positions.map((position) => {
                  const multiplier = position.multiplier ?? 1;
                  const marketValue = position.quantity * position.currentMark * multiplier;
                  const totalPnl = position.quantity * (position.currentMark - position.averageEntry) * multiplier;

                  return (
                    <tr key={position.symbol} className="h-11 border-b border-[#67809622] text-[#d7e0eb]">
                      <td className="px-3 font-mono text-white">{position.symbol}</td>
                      <td className="px-3 capitalize">{position.assetType}</td>
                      <td className="px-3 font-mono">{position.quantity}</td>
                      <td className="px-3 font-mono">{currency(position.averageEntry)}</td>
                      <td className="px-3 font-mono">{currency(position.currentMark)}</td>
                      <td className="px-3 font-mono">{currency(marketValue)}</td>
                      <td className="px-3 font-mono text-[#91d66f]">+$18.42</td>
                      <td className="px-3 font-mono text-[#91d66f]">{signedCurrency(totalPnl)}</td>
                      <td className="px-3 font-mono">{percent((marketValue / totalValue) * 100).replace("+", "")}</td>
                    </tr>
                  );
                })}
              />
            ) : (
              <EmptyState
                title="No open positions"
                body="Open positions will appear after authenticated paper-trade execution is connected. Start with a cash deposit or build a trade thesis."
                action={
                  <div className="flex gap-2">
                    <Link className="rounded-[4px] bg-[#2e67b7] px-3 py-2 text-[12px] font-semibold text-white" href="/cash">
                      Deposits & Cash
                    </Link>
                    <Link className="rounded-[4px] border border-[#67809640] px-3 py-2 text-[12px] text-[#d7e0eb]" href="/trade">
                      Open Trade
                    </Link>
                  </div>
                }
              />
            )}
          </TerminalPanel>

          <TerminalPanel title="Open Position Detail">
            <div className="grid grid-cols-3 gap-3 p-3 text-[12px]">
              <DetailBlock label="Risk basis" value={fixture ? "$735.00 premium + stop plan" : "No active position selected"} />
              <DetailBlock label="Journal thesis" value={fixture ? "Trend continuation with explicit invalidation." : "Create a trade thesis from Trade."} />
              <DetailBlock label="Next action" value={fixture ? "Review stop after close" : "Select or open a position"} />
            </div>
          </TerminalPanel>
        </div>

        <div className="space-y-[10px]">
          <MetricCard label="Account Equity" value={currency(totalValue)} support={fixture ? "Fixture allocation" : "No positions"} />
          <MetricCard label="Cash Reserve" value={fixture ? "$3,554.16" : "$0.00"} support="Separate from returns" />
          <TerminalPanel title="Allocation">
            <div className="space-y-2 p-3">
              {(positions.length ? positions : [{ symbol: "No allocation", currentMark: 0 }]).map((position) => (
                <div key={position.symbol} className="rounded-[3px] border border-[#67809626] bg-[#0a1017] px-3 py-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="font-mono text-white">{position.symbol}</span>
                    <span className="text-[#9aa7b7]">{fixture ? "33%" : "0%"}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-[#162130]">
                    <div className="h-full rounded-full bg-[#4ea3ff]" style={{ width: fixture ? "33%" : "0%" }} />
                  </div>
                </div>
              ))}
            </div>
          </TerminalPanel>
        </div>
      </div>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[4px] border border-[#67809626] bg-[#0a1017] p-3">
      <p className="text-[#9aa7b7]">{label}</p>
      <p className="mt-2 text-white">{value}</p>
    </div>
  );
}
