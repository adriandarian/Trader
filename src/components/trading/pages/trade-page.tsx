"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { fixtureQuote } from "../design-fixtures";
import { currency, percent, signedCurrency } from "../format";
import { ChartFrame, DataStatusBadge, TerminalPanel } from "../terminal-ui";

export function TradePage({ fixture, symbol }: { fixture: boolean; symbol?: string }) {
  const activeSymbol = (symbol || (fixture ? fixtureQuote.symbol : "SPY")).toUpperCase();
  const [side, setSide] = useState<"Buy" | "Sell">("Buy");
  const [assetType, setAssetType] = useState<"Stock" | "Option">("Stock");
  const [orderType, setOrderType] = useState<"Market" | "Limit">("Market");
  const [quantity, setQuantity] = useState("10");
  const [reviewOpen, setReviewOpen] = useState(false);

  const mark = fixture ? fixtureQuote.last : null;
  const estimate = mark ? Number(quantity || 0) * mark : 0;

  return (
    <div className="mx-auto min-h-full max-w-[1180px]" data-testid="route-content">
      <h1 className="mb-2 text-[22px] font-semibold tracking-[-0.02em] text-white">Trade</h1>
      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-[10px]">
        <div className="space-y-[10px]">
          <TerminalPanel title="Selected Symbol" action={<DataStatusBadge label={fixture ? "Fixture quote" : "Quote required before execution"} tone={fixture ? "warning" : "neutral"} />}>
            <div className="grid grid-cols-[220px_minmax(0,1fr)] gap-4 p-3">
              <div className="rounded-[4px] border border-[#67809626] bg-[#0a1017] p-4">
                <p className="font-mono text-[28px] font-semibold text-white">{activeSymbol}</p>
                <p className="mt-1 text-[12px] text-[#9aa7b7]">{fixture ? fixtureQuote.name : "Load provider quote before order review"}</p>
                <p className="mt-5 font-mono text-[22px] text-white">{mark ? currency(mark) : "-"}</p>
                <p className="mt-1 font-mono text-[12px] text-[#91d66f]">{fixture ? `${signedCurrency(fixtureQuote.change)} (${percent(fixtureQuote.changePercent)})` : "No runtime quote loaded"}</p>
              </div>
              <ChartFrame height="h-[230px]">
                {fixture ? <div className="absolute inset-x-[80px] bottom-[76px] h-[84px] border-l-2 border-t-2 border-[#4ea3ff]" /> : null}
              </ChartFrame>
            </div>
          </TerminalPanel>

          <TerminalPanel title="Position Context">
            <div className="grid grid-cols-4 gap-3 p-3">
              <ContextBlock label="Current position" value={fixture ? "18 shares long" : "No position loaded"} />
              <ContextBlock label="Average entry" value={fixture ? "$126.40" : "-"} />
              <ContextBlock label="Unrealized P/L" value={fixture ? "+$293.04" : "-"} tone="text-[#91d66f]" />
              <ContextBlock label="Buying power impact" value={estimate ? currency(estimate) : "Requires quote"} />
            </div>
          </TerminalPanel>

          <TerminalPanel title="Pre-Trade Journal">
            <div className="grid grid-cols-2 gap-3 p-3 text-[12px]">
              <JournalInput label="Thesis" value={fixture ? "Continuation through morning high with strong volume confirmation." : ""} />
              <JournalInput label="Strategy tag" value={fixture ? "Momentum / Trend" : ""} />
              <JournalInput label="Maximum risk" value={fixture ? "$350" : ""} />
              <JournalInput label="Stop / invalidation" value={fixture ? "Close below VWAP and prior pivot." : ""} />
              <JournalInput label="Target" value={fixture ? "First scale at +2R, trail balance." : ""} />
              <JournalInput label="Confidence" value={fixture ? "Medium-high, 7/10" : ""} />
            </div>
          </TerminalPanel>
        </div>

        <TerminalPanel title="Order Ticket">
          <div className="space-y-3 p-3 text-[12px]">
            <div className="grid grid-cols-2 overflow-hidden rounded-[4px] border border-[#67809626] bg-[#0a1017]">
              {(["Buy", "Sell"] as const).map((value) => (
                <button key={value} className={`h-9 ${side === value ? "bg-[#172232] text-white" : "text-[#9aa7b7]"}`} onClick={() => setSide(value)} type="button">
                  {value}
                </button>
              ))}
            </div>
            <TicketSelect label="Asset" options={["Stock", "Option"]} value={assetType} onChange={(value) => setAssetType(value as "Stock" | "Option")} />
            <TicketSelect label="Order Type" options={["Market", "Limit"]} value={orderType} onChange={(value) => setOrderType(value as "Market" | "Limit")} />
            <label className="block">
              <span className="mb-1 block text-[#c2ccd8]">Quantity</span>
              <input className="h-9 w-full rounded-[4px] border border-[#67809640] bg-[#111a25] px-3 font-mono text-white outline-none" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            </label>
            <div className="rounded-[4px] border border-[#67809626] bg-[#0a1017] p-3">
              <TicketLine label="Estimated execution" value={mark ? currency(mark) : "Blocked until quote loads"} />
              <TicketLine label="Estimated notional" value={estimate ? currency(estimate) : "-"} />
              <TicketLine label="Buying-power impact" value={estimate ? `-${currency(estimate)}` : "-"} />
              <TicketLine label="Execution status" value="Disabled pending auth/data/database" />
            </div>
            <button className="h-10 w-full rounded-[4px] bg-[#2e67b7] text-[12px] font-semibold text-white" onClick={() => setReviewOpen(true)} type="button">
              Review Order
            </button>
            <p className="text-[11px] leading-5 text-[#9aa7b7]">Paper-trading only. Live trading and brokerage-account integration are intentionally unavailable.</p>
          </div>
        </TerminalPanel>
      </div>

      {reviewOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
          <div className="w-[520px] rounded-[4px] border border-[#67809666] bg-[#0d141d] p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-white">Order Review</h2>
              <button className="text-[#9aa7b7]" onClick={() => setReviewOpen(false)} type="button">
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-3 text-[13px] leading-6 text-[#c2ccd8]">
              Review prepared for {side} {quantity || "0"} {assetType.toLowerCase()} units of {activeSymbol}. Submission remains disabled until authenticated database-backed paper execution is connected.
            </p>
            <button className="mt-4 h-10 w-full rounded-[4px] border border-[#67809640] text-[12px] font-semibold text-[#d7e0eb]" disabled type="button">
              Execution Disabled
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ContextBlock({ label, value, tone = "text-white" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-[4px] border border-[#67809626] bg-[#0a1017] p-3 text-[12px]">
      <p className="text-[#9aa7b7]">{label}</p>
      <p className={`mt-2 font-mono ${tone}`}>{value}</p>
    </div>
  );
}

function JournalInput({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[#c2ccd8]">{label}</span>
      <textarea className="h-20 w-full resize-none rounded-[4px] border border-[#67809640] bg-[#111a25] p-3 text-white outline-none placeholder:text-[#6f7c8c]" defaultValue={value} placeholder={`Enter ${label.toLowerCase()}`} />
    </label>
  );
}

function TicketSelect({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[#c2ccd8]">{label}</span>
      <select className="h-9 w-full rounded-[4px] border border-[#67809640] bg-[#111a25] px-3 text-white outline-none" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TicketLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[#9aa7b7]">{label}</span>
      <span className="font-mono text-white">{value}</span>
    </div>
  );
}
