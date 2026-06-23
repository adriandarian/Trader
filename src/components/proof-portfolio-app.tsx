"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  CircleDollarSign,
  Clock3,
  Landmark,
  LineChart,
  Loader2,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

import { currency, percent, signedCurrency, summarizeProofPortfolio } from "@/domain/accounting";
import type { ProofPortfolioSummary } from "@/domain/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type QuoteResponse = {
  quote?: {
    symbol: string;
    bid: number | null;
    ask: number | null;
    last: number | null;
    mark: number | null;
    dayChange: number | null;
    dayChangePercent: number | null;
    dayHigh: number | null;
    dayLow: number | null;
    volume: number | null;
    source: {
      label: string;
      asOf: string | null;
      feed: string;
    };
  };
  clock?: {
    isOpen: boolean | null;
    timestamp: string;
    nextOpen: string | null;
    nextClose: string | null;
  } | null;
  error?: string;
  code?: string;
};

type SearchResult = {
  symbol: string;
  name: string;
  exchange?: string;
  assetType: string;
  tradable?: boolean;
};

const navItems = [
  ["Overview", Activity],
  ["Markets", LineChart],
  ["Portfolio", BriefcaseBusiness],
  ["Trade", CircleDollarSign],
  ["Journal", BookOpen],
  ["Deposits & Cash", Landmark],
  ["Performance", BarChart3],
  ["Settings", Settings],
] as const;

const rangeOptions = ["1W", "1M", "3M", "YTD", "All"];

export function ProofPortfolioApp() {
  const [activeSection, setActiveSection] = useState("Overview");
  const [symbolQuery, setSymbolQuery] = useState("SPY");
  const [quoteState, setQuoteState] = useState<QuoteResponse>({});
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [range, setRange] = useState("1M");
  const [depositDraft, setDepositDraft] = useState({
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    category: "paycheck",
    sourceLabel: "",
    notes: "",
  });

  const summary = useMemo(
    () =>
      summarizeProofPortfolio({
        cashLedgerEntries: [],
        positions: [],
        snapshots: [],
      }),
    [],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialQuote() {
      setIsLoadingQuote(true);

      try {
        const response = await fetch("/api/market-data/quote?symbol=SPY", { signal: controller.signal });
        const payload = (await response.json()) as QuoteResponse;
        setQuoteState(payload);
      } catch {
        if (!controller.signal.aborted) {
          setQuoteState({ error: "Unable to reach the market-data route.", code: "NETWORK_ERROR" });
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingQuote(false);
        }
      }
    }

    void loadInitialQuote();

    return () => controller.abort();
  }, []);

  async function loadQuote(symbol = symbolQuery) {
    const normalized = symbol.trim().toUpperCase();

    if (!normalized) {
      return;
    }

    setIsLoadingQuote(true);
    setQuoteState({});

    try {
      const response = await fetch(`/api/market-data/quote?symbol=${encodeURIComponent(normalized)}`);
      const payload = (await response.json()) as QuoteResponse;
      setQuoteState(payload);
      setSymbolQuery(normalized);
    } catch {
      setQuoteState({ error: "Unable to reach the market-data route.", code: "NETWORK_ERROR" });
    } finally {
      setIsLoadingQuote(false);
    }
  }

  async function searchSymbols() {
    const query = symbolQuery.trim();

    if (!query) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(`/api/market-data/search?q=${encodeURIComponent(query)}`);
      const payload = (await response.json()) as { results?: SearchResult[] };
      setSearchResults(payload.results ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080b0f] text-[#e8edf2]">
      <div className="grid min-h-screen lg:grid-cols-[232px_1fr]">
        <aside className="hidden border-r border-white/8 bg-[#0b0f14] lg:block">
          <div className="flex h-16 items-center gap-3 border-b border-white/8 px-5">
            <div className="flex size-9 items-center justify-center rounded-md border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Proof Portfolio</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Paper terminal</p>
            </div>
          </div>
          <nav className="space-y-1 px-3 py-4">
            {navItems.map(([label, Icon]) => (
              <button
                key={label}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition ${
                  activeSection === label
                    ? "bg-slate-800/80 text-white"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                }`}
                onClick={() => setActiveSection(label)}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0">
          <TopCommandBar
            symbolQuery={symbolQuery}
            setSymbolQuery={setSymbolQuery}
            quoteState={quoteState}
            isLoadingQuote={isLoadingQuote}
            onQuote={() => loadQuote()}
            onSearch={searchSymbols}
          />

          <div className="grid min-w-0 gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-4">
              <MobileNav activeSection={activeSection} setActiveSection={setActiveSection} />
              <Overview summary={summary} range={range} setRange={setRange} />
              <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
                <RecentTrades />
                <CashLedgerPreview />
              </div>
            </div>

            <aside className="min-w-0 space-y-4">
              <MarketPanel
                symbolQuery={symbolQuery}
                setSymbolQuery={setSymbolQuery}
                quoteState={quoteState}
                searchResults={searchResults}
                isLoadingQuote={isLoadingQuote}
                isSearching={isSearching}
                onQuote={loadQuote}
                onSearch={searchSymbols}
              />
              <DepositPanel depositDraft={depositDraft} setDepositDraft={setDepositDraft} />
              <ProofScorecard />
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function TopCommandBar({
  symbolQuery,
  setSymbolQuery,
  quoteState,
  isLoadingQuote,
  onQuote,
  onSearch,
}: {
  symbolQuery: string;
  setSymbolQuery: (value: string) => void;
  quoteState: QuoteResponse;
  isLoadingQuote: boolean;
  onQuote: () => void;
  onSearch: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 flex min-h-16 flex-col gap-3 border-b border-white/8 bg-[#0a0e13]/95 px-4 py-3 backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center rounded-md border border-white/10 bg-[#111820] px-3">
          <Search className="size-4 text-slate-500" />
          <input
            className="h-9 min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600"
            value={symbolQuery}
            placeholder="Search symbol"
            onChange={(event) => setSymbolQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onQuote();
                onSearch();
              }
            }}
          />
          <Button size="sm" variant="secondary" onClick={onQuote} disabled={isLoadingQuote}>
            {isLoadingQuote ? <Loader2 className="size-3.5 animate-spin" /> : "Quote"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <StatusPill
          label={
            quoteState.clock?.isOpen === true
              ? "Market open"
              : quoteState.clock?.isOpen === false
                ? "Market closed"
                : "Market status unknown"
          }
          tone={quoteState.clock?.isOpen ? "positive" : "neutral"}
        />
        <StatusPill label={quoteState.quote?.source.label ?? "Alpaca not connected"} tone="neutral" />
        <span className="font-mono">
          Last updated {formatTimestamp(quoteState.quote?.source.asOf ?? quoteState.clock?.timestamp ?? null)}
        </span>
        <div className="rounded-md border border-white/10 px-2 py-1 text-slate-300">Personal</div>
      </div>
    </header>
  );
}

function MobileNav({
  activeSection,
  setActiveSection,
}: {
  activeSection: string;
  setActiveSection: (value: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto lg:hidden">
      {navItems.map(([label]) => (
        <button
          key={label}
          className={`shrink-0 rounded-md border px-3 py-2 text-xs ${
            activeSection === label ? "border-slate-500 bg-slate-800 text-white" : "border-white/10 text-slate-400"
          }`}
          onClick={() => setActiveSection(label)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Overview({
  summary,
  range,
  setRange,
}: {
  summary: ProofPortfolioSummary;
  range: string;
  setRange: (value: string) => void;
}) {
  const metrics = [
    ["Total portfolio value", currency(summary.totalPortfolioValue), "neutral"],
    ["Cash available", currency(summary.cashAvailable), "neutral"],
    ["Invested market value", currency(summary.investedMarketValue), "neutral"],
    ["Today's P/L", signedCurrency(summary.todayPnl), valueTone(summary.todayPnl)],
    ["Total realized P/L", signedCurrency(summary.totalRealizedPnl), valueTone(summary.totalRealizedPnl)],
    ["Total unrealized P/L", signedCurrency(summary.totalUnrealizedPnl), valueTone(summary.totalUnrealizedPnl)],
    ["Net contributions", currency(summary.netContributions), "neutral"],
    ["Trading return excl. deposits", signedCurrency(summary.tradingReturnExcludingDeposits), valueTone(summary.tradingReturnExcludingDeposits)],
    ["Time-weighted return", percent(summary.timeWeightedReturn), valueTone(summary.timeWeightedReturn)],
    ["Benchmark vs SPY", percent(summary.benchmarkReturn), valueTone(summary.benchmarkReturn)],
  ] as const;

  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-[#0d131a]">
      <div className="flex flex-col gap-4 border-b border-white/8 p-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Overview</h1>
          <p className="mt-1 max-w-2xl text-wrap text-sm text-slate-400">
            Proof screen separating external cash flows from market results. No seeded positions, fake prices, or fabricated
            performance metrics are shown.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-200">
          <CalendarClock className="size-4" />
          Awaiting first portfolio snapshot
        </div>
      </div>

      <div className="grid gap-px bg-white/8 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map(([label, value, tone]) => (
          <MetricCell key={label} label={label} value={value} tone={tone} />
        ))}
      </div>

      <div className="grid min-w-0 gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-md border border-white/10 bg-[#090d12] p-4">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-medium text-white">Equity curve</h2>
              <p className="text-xs text-slate-500">Portfolio value, net contributed capital, and SPY comparison.</p>
            </div>
            <div className="flex gap-1">
              {rangeOptions.map((option) => (
                <button
                  key={option}
                  className={`rounded px-2 py-1 font-mono text-[11px] ${
                    range === option ? "bg-slate-700 text-white" : "text-slate-500 hover:bg-slate-900"
                  }`}
                  onClick={() => setRange(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <EmptyChart />
        </div>

        <div className="rounded-md border border-white/10 bg-[#090d12] p-4">
          <h2 className="text-sm font-medium text-white">Data quality</h2>
          <div className="mt-4 space-y-3 text-xs text-slate-400">
            <QualityRow label="Stock quotes" value="Alpaca IEX when configured" />
            <QualityRow label="Options" value="Empty until feed enabled" />
            <QualityRow label="Performance" value="Stored snapshots only" />
            <QualityRow label="External flows" value="Cash ledger, not P/L" />
          </div>
        </div>
      </div>
    </section>
  );
}

function MarketPanel({
  symbolQuery,
  setSymbolQuery,
  quoteState,
  searchResults,
  isLoadingQuote,
  isSearching,
  onQuote,
  onSearch,
}: {
  symbolQuery: string;
  setSymbolQuery: (value: string) => void;
  quoteState: QuoteResponse;
  searchResults: SearchResult[];
  isLoadingQuote: boolean;
  isSearching: boolean;
  onQuote: (symbol?: string) => void;
  onSearch: () => void;
}) {
  const quote = quoteState.quote;

  return (
    <section className="rounded-lg border border-white/10 bg-[#0d131a] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Markets</h2>
          <p className="text-xs text-slate-500">Real provider responses only</p>
        </div>
        <Badge variant="outline" className="border-slate-700 text-slate-300">
          {quote?.source.label ?? "No feed"}
        </Badge>
      </div>

      <div className="flex gap-2">
        <Input
          className="border-white/10 bg-[#090d12] text-slate-100"
          value={symbolQuery}
          onChange={(event) => setSymbolQuery(event.target.value.toUpperCase())}
          placeholder="AAPL"
        />
        <Button variant="secondary" onClick={() => onQuote()} disabled={isLoadingQuote}>
          {isLoadingQuote ? <Loader2 className="size-4 animate-spin" /> : "Fetch"}
        </Button>
        <Button variant="outline" onClick={onSearch} disabled={isSearching}>
          <SlidersHorizontal className="size-4" />
        </Button>
      </div>

      {quoteState.error ? (
        <div className="mt-4 rounded-md border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-100">
          {quoteState.error}
        </div>
      ) : null}

      {quote ? (
        <div className="mt-4 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-500">{quote.symbol}</p>
              <p className="font-mono text-3xl font-semibold text-white">{nullableCurrency(quote.mark)}</p>
            </div>
            <p className={`font-mono text-sm ${valueClass(quote.dayChange ?? 0)}`}>
              {quote.dayChange === null ? "No day change" : `${signedCurrency(quote.dayChange)} (${percent(quote.dayChangePercent ?? 0)})`}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-white/10 bg-white/8">
            <QuoteCell label="Bid" value={nullableCurrency(quote.bid)} />
            <QuoteCell label="Ask" value={nullableCurrency(quote.ask)} />
            <QuoteCell label="Day range" value={`${nullableCurrency(quote.dayLow)} - ${nullableCurrency(quote.dayHigh)}`} />
            <QuoteCell label="Volume" value={quote.volume === null ? "Unavailable" : quote.volume.toLocaleString()} />
          </div>
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Clock3 className="size-3.5" />
            Last updated {formatTimestamp(quote.source.asOf)}
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-dashed border-white/10 p-4 text-sm text-slate-500">
          Fetch a ticker to show real bid, ask, mark, source, and timestamp. Mock quotes are not substituted.
        </div>
      )}

      {searchResults.length ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Search results</p>
          {searchResults.map((result) => (
            <button
              key={result.symbol}
              className="w-full rounded-md border border-white/10 p-3 text-left hover:bg-slate-900"
              onClick={() => onQuote(result.symbol)}
            >
              <span className="font-mono text-sm text-white">{result.symbol}</span>
              <span className="ml-2 text-xs text-slate-500">{result.exchange ?? result.assetType}</span>
              <p className="mt-1 truncate text-xs text-slate-400">{result.name}</p>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function DepositPanel({
  depositDraft,
  setDepositDraft,
}: {
  depositDraft: {
    amount: string;
    date: string;
    category: string;
    sourceLabel: string;
    notes: string;
  };
  setDepositDraft: React.Dispatch<
    React.SetStateAction<{
      amount: string;
      date: string;
      category: string;
      sourceLabel: string;
      notes: string;
    }>
  >;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#0d131a] p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-white">Deposits & Cash</h2>
        <p className="text-xs text-slate-500">External money is tracked separately from performance.</p>
      </div>
      <FieldGroup>
        <Field>
          <FieldLabel className="text-slate-400">Amount</FieldLabel>
          <Input
            className="border-white/10 bg-[#090d12] text-slate-100"
            inputMode="decimal"
            value={depositDraft.amount}
            placeholder="0.00"
            onChange={(event) => setDepositDraft((current) => ({ ...current, amount: event.target.value }))}
          />
        </Field>
        <Field>
          <FieldLabel className="text-slate-400">Date</FieldLabel>
          <Input
            className="border-white/10 bg-[#090d12] text-slate-100"
            type="date"
            value={depositDraft.date}
            onChange={(event) => setDepositDraft((current) => ({ ...current, date: event.target.value }))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel className="text-slate-400">Category</FieldLabel>
            <select
              className="h-9 rounded-md border border-white/10 bg-[#090d12] px-3 text-sm text-slate-100"
              value={depositDraft.category}
              onChange={(event) => setDepositDraft((current) => ({ ...current, category: event.target.value }))}
            >
              <option value="paycheck">Paycheck</option>
              <option value="bonus">Bonus</option>
              <option value="manual contribution">Manual</option>
              <option value="correction">Correction</option>
            </select>
          </Field>
          <Field>
            <FieldLabel className="text-slate-400">Source</FieldLabel>
            <Input
              className="border-white/10 bg-[#090d12] text-slate-100"
              value={depositDraft.sourceLabel}
              placeholder="Employer"
              onChange={(event) => setDepositDraft((current) => ({ ...current, sourceLabel: event.target.value }))}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel className="text-slate-400">Notes</FieldLabel>
          <Textarea
            className="min-h-20 border-white/10 bg-[#090d12] text-slate-100"
            value={depositDraft.notes}
            onChange={(event) => setDepositDraft((current) => ({ ...current, notes: event.target.value }))}
          />
        </Field>
        <Button disabled variant="secondary" className="w-full opacity-60">
          Connect Supabase auth to post deposit
        </Button>
        <p className="text-xs leading-5 text-slate-500">
          The database and RLS foundation is in place. Posting is disabled until an authenticated Supabase account context is
          available, so drafts are not silently stored in localStorage.
        </p>
      </FieldGroup>
    </section>
  );
}

function ProofScorecard() {
  const rows = [
    ["Win rate", "No closed trades"],
    ["Average win", "No closed trades"],
    ["Average loss", "No closed trades"],
    ["Profit factor", "No closed trades"],
    ["Max drawdown", "No snapshots"],
    ["Average holding period", "No closed trades"],
  ];

  return (
    <section className="rounded-lg border border-white/10 bg-[#0d131a] p-4">
      <h2 className="text-sm font-semibold text-white">Proof scorecard</h2>
      <div className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <QualityRow key={label} label={label} value={value} />
        ))}
      </div>
    </section>
  );
}

function RecentTrades() {
  return (
    <section className="rounded-lg border border-white/10 bg-[#0d131a]">
      <div className="border-b border-white/8 p-4">
        <h2 className="text-sm font-semibold text-white">Recent trades</h2>
        <p className="text-xs text-slate-500">Closed trades will be immutable and corrected through adjustment events.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-[#090d12] text-xs text-slate-500">
            <tr>
              {["Time", "Symbol", "Type", "Side", "Qty", "Fill", "Thesis", "Status"].map((head) => (
                <th key={head} className="px-4 py-3 text-left font-medium">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                No trades yet. The terminal will only show orders filled from stored quote timestamps and bid/ask data.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CashLedgerPreview() {
  return (
    <section className="rounded-lg border border-white/10 bg-[#0d131a]">
      <div className="border-b border-white/8 p-4">
        <h2 className="text-sm font-semibold text-white">Cash-flow timeline</h2>
        <p className="text-xs text-slate-500">Deposits, withdrawals, fees, dividends, and trade credits/debits.</p>
      </div>
      <div className="flex h-56 items-center justify-center p-4 text-center text-sm text-slate-500">
        No ledger entries yet. Add authenticated cash flows to build contribution and TWR history.
      </div>
    </section>
  );
}

function MetricCell({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="bg-[#0d131a] p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-2 font-mono text-lg font-semibold ${toneClass(tone)}`}>{value}</p>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="relative h-[320px] overflow-hidden rounded-md border border-white/8 bg-[#070a0e]">
      <div className="absolute inset-0 chart-grid" />
      <div className="absolute inset-x-6 bottom-10 top-8 flex items-end justify-between opacity-30">
        {Array.from({ length: 18 }).map((_, index) => (
          <div key={index} className="h-full w-px bg-slate-800" />
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <LineChart className="mb-3 size-9 text-slate-600" />
        <p className="text-sm font-medium text-slate-300">No stored snapshots</p>
        <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
          Equity curves unlock after real positions, cash flows, and dated portfolio snapshots exist in Supabase.
        </p>
      </div>
    </div>
  );
}

function QuoteCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0d131a] p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-sm text-slate-100">{value}</p>
    </div>
  );
}

function QualityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-40 text-right text-slate-300">{value}</span>
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "positive" | "neutral" }) {
  return (
    <span
      className={`rounded-md border px-2 py-1 ${
        tone === "positive" ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" : "border-white/10 text-slate-300"
      }`}
    >
      {label}
    </span>
  );
}

function nullableCurrency(value: number | null) {
  return value === null ? "Unavailable" : currency(value);
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return "unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function valueTone(value: number) {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

function toneClass(tone: string) {
  if (tone === "positive") return "text-emerald-300";
  if (tone === "negative") return "text-red-300";
  return "text-slate-100";
}

function valueClass(value: number) {
  return value > 0 ? "text-emerald-300" : value < 0 ? "text-red-300" : "text-slate-400";
}
