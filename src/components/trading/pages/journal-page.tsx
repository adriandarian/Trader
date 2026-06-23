import Link from "next/link";

import { fixtureTrades } from "../design-fixtures";
import { EmptyState, TableShell, TerminalPanel } from "../terminal-ui";

export function JournalPage({ fixture }: { fixture: boolean }) {
  const trades = fixture ? fixtureTrades : [];

  return (
    <div className="mx-auto min-h-full max-w-[1180px]" data-testid="route-content">
      <h1 className="mb-2 text-[22px] font-semibold tracking-[-0.02em] text-white">Journal</h1>
      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-[10px]">
        <div className="space-y-[10px]">
          <TerminalPanel title="Trade Journal" action={<FilterChips />}>
            {trades.length ? (
              <TableShell
                columns={["Status", "Symbol", "Setup", "Risk Plan", "Exit Rationale", "Lesson", "Tags"]}
                rows={trades.map((trade) => (
                  <tr key={trade.symbol} className="h-12 border-b border-[#67809622] text-[#d7e0eb]">
                    <td className="px-3">{trade.status}</td>
                    <td className="px-3 font-mono text-white">{trade.symbol}</td>
                    <td className="px-3">{trade.thesis}</td>
                    <td className="px-3">{trade.risk}</td>
                    <td className="px-3">Exit plan pending</td>
                    <td className="px-3">Track reaction at invalidation.</td>
                    <td className="px-3 text-[#9aa7b7]">momentum, risk-defined</td>
                  </tr>
                ))}
              />
            ) : (
              <EmptyState
                title="No journal entries yet"
                body="Create a pre-trade thesis from the Trade page. Entries will keep thesis, risk plan, exit rationale, lessons, tags, and activity trail together."
                action={
                  <Link className="rounded-[4px] bg-[#2e67b7] px-3 py-2 text-[12px] font-semibold text-white" href="/trade">
                    Create Trade Thesis
                  </Link>
                }
              />
            )}
          </TerminalPanel>

          <TerminalPanel title="Activity Trail">
            <div className="space-y-2 p-3 text-[12px]">
              {(trades.length ? trades : [{ symbol: "Awaiting trade", time: "-", result: "No authenticated activity has been recorded." }]).map((trade) => (
                <div key={`${trade.symbol}-${trade.time}`} className="rounded-[4px] border border-[#67809626] bg-[#0a1017] p-3">
                  <p className="font-mono text-white">{trade.symbol}</p>
                  <p className="mt-1 text-[#9aa7b7]">{trade.result}</p>
                </div>
              ))}
            </div>
          </TerminalPanel>
        </div>

        <TerminalPanel title="Journal Detail">
          <div className="space-y-3 p-3 text-[12px]">
            <Detail label="Thesis" value={fixture ? fixtureTrades[0].thesis : "Select or create a trade thesis."} />
            <Detail label="Risk plan" value={fixture ? fixtureTrades[0].risk : "Risk plan required before order review."} />
            <Detail label="Exit rationale" value={fixture ? "Scale at target, close on invalidation." : "Exit notes appear after a position is closed."} />
            <Detail label="Lessons" value={fixture ? "Confirm volume before adding to position." : "Lessons will be captured per trade."} />
            <Detail label="Tags" value={fixture ? "momentum, equity, paper" : "No tags yet."} />
          </div>
        </TerminalPanel>
      </div>
    </div>
  );
}

function FilterChips() {
  return (
    <div className="flex gap-1">
      {["all", "open", "closed", "stocks", "options"].map((chip) => (
        <button key={chip} className={`h-7 rounded-[3px] px-2 text-[12px] ${chip === "all" ? "bg-[#172232] text-white" : "text-[#9aa7b7]"}`} type="button">
          {chip}
        </button>
      ))}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[4px] border border-[#67809626] bg-[#0a1017] p-3">
      <p className="font-semibold text-white">{label}</p>
      <p className="mt-2 leading-5 text-[#c2ccd8]">{value}</p>
    </div>
  );
}
