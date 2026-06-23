import Link from "next/link";
import { Landmark, Search } from "lucide-react";

import { fixtureCashLedger, fixtureQuote } from "./design-fixtures";
import { currency, formatNumber, formatTimestamp, percent, signedCurrency } from "./format";
import { DataStatusBadge, EmptyState, SegmentedControl, TerminalPanel } from "./terminal-ui";

export function OverviewRightRail({ fixture }: { fixture: boolean }) {
  return (
    <div className="space-y-[10px]">
      <TerminalPanel
        title="Markets"
        action={<DataStatusBadge label={fixture ? "Fixture Preview" : "Provider status"} tone={fixture ? "warning" : "neutral"} />}
        className="min-h-[478px] overflow-hidden"
      >
        {fixture ? (
          <div className="space-y-3 p-3">
            <div className="flex h-8 items-center rounded-[4px] border border-[#67809640] bg-[#111a25] px-2 text-[12px] text-[#d7e0eb]">
              <Search className="mr-2 size-4 text-[#8794a4]" />
              {fixtureQuote.symbol} - {fixtureQuote.name}
            </div>
            <div className="rounded-[4px] border border-[#67809626] bg-[#0a1017] p-3">
              <div className="grid grid-cols-[1fr_130px] gap-3">
                <div>
                  <p className="font-mono text-[19px] font-semibold text-white">{fixtureQuote.symbol}</p>
                  <p className="mt-2 text-[12px] text-[#9aa7b7]">{fixtureQuote.name}</p>
                  <p className="mt-3 font-mono text-[19px] text-white">{currency(fixtureQuote.last)}</p>
                  <p className="mt-1 font-mono text-[12px] text-[#91d66f]">
                    {signedCurrency(fixtureQuote.change)} ({percent(fixtureQuote.changePercent)})
                  </p>
                </div>
                <div className="space-y-2 text-[12px]">
                  <RailLine label="Bid" value={currency(fixtureQuote.bid)} />
                  <RailLine label="Ask" value={currency(fixtureQuote.ask)} />
                  <RailLine label="Vol" value={formatNumber(fixtureQuote.volume)} />
                  <RailLine label="Source" value="IEX" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <SegmentedControl compact options={["1D", "5D", "1M", "3M", "1Y"]} value="1D" />
                <Link className="rounded-[4px] bg-[#2e67b7] px-3 py-2 text-[12px] font-semibold text-white" href="/trade?symbol=NVDA">
                  Trade
                </Link>
              </div>
              <div className="mt-3 h-[248px] rounded-[3px] border border-[#67809626] chart-grid" />
              <p className="mt-2 font-mono text-[11px] text-[#9aa7b7]">As of {formatTimestamp(fixtureQuote.timestamp)}</p>
            </div>
          </div>
        ) : (
          <EmptyState
            icon="search"
            title="Connect market data to research symbols"
            body="The app uses the existing Alpaca-backed API routes. Configure Alpaca credentials to show quotes; runtime will not substitute fixture prices."
            action={
              <Link className="rounded-[4px] bg-[#2e67b7] px-3 py-2 text-[12px] font-semibold text-white" href="/markets">
                Open Markets
              </Link>
            }
          />
        )}
      </TerminalPanel>

      <TerminalPanel title="Deposits & Cash" className="min-h-[368px] overflow-hidden">
        {fixture ? (
          <div className="p-3">
            <div className="grid grid-cols-2 overflow-hidden rounded-[4px] border border-[#67809626] bg-[#0a1017] text-[12px]">
              <button className="h-7 bg-[#172232] font-medium text-white" type="button">
                Deposit Funds
              </button>
              <button className="h-7 text-[#9aa7b7]" type="button">
                Withdraw
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {fixtureCashLedger.slice(0, 4).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-[3px] border border-[#67809626] bg-[#0a1017] px-3 py-2 text-[12px]">
                  <span className="text-[#c2ccd8]">{entry.sourceLabel}</span>
                  <span className={`font-mono ${entry.amount >= 0 ? "text-[#91d66f]" : "text-[#ff666b]"}`}>{signedCurrency(entry.amount)}</span>
                </div>
              ))}
            </div>
            <Link className="mt-3 inline-flex items-center gap-2 text-[12px] text-[#4ea3ff]" href="/cash">
              View cash ledger
              <Landmark className="size-3.5" />
            </Link>
          </div>
        ) : (
          <EmptyState
            icon="file"
            title="No cash activity recorded"
            body="Deposits are tracked separately from investment returns. Sign in before recording ledger entries."
            action={
              <Link className="rounded-[4px] bg-[#2e67b7] px-3 py-2 text-[12px] font-semibold text-white" href="/cash">
                Manage Cash
              </Link>
            }
          />
        )}
      </TerminalPanel>
    </div>
  );
}

function RailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[#c2ccd8]">{label}</span>
      <span className="truncate font-mono text-white">{value}</span>
    </div>
  );
}
