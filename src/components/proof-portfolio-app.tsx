"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  FileText,
  Globe2,
  Info,
  Landmark,
  LayoutGrid,
  Loader2,
  Search,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { currency, percent, signedCurrency, summarizeProofPortfolio } from "@/domain/accounting";
import type { ProofPortfolioSummary } from "@/domain/types";

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
  clock?: MarketClock | null;
  error?: string;
  code?: string;
};

type MarketClock = {
  isOpen: boolean | null;
  timestamp: string;
  nextOpen: string | null;
  nextClose: string | null;
};

type ClockResponse = {
  clock?: MarketClock;
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
  ["Overview", LayoutGrid],
  ["Markets", Globe2],
  ["Portfolio", BriefcaseBusiness],
  ["Trade", ArrowLeftRight],
  ["Journal", BookOpen],
  ["Deposits & Cash", Landmark],
  ["Performance", BarChart3],
  ["Settings", Settings],
] as const;

const rangeOptions = ["1W", "1M", "3M", "YTD", "All"];
const marketRangeOptions = ["1D", "5D", "1M", "3M", "1Y", "5Y", "All"];

export function ProofPortfolioApp() {
  const [activeSection, setActiveSection] = useState("Overview");
  const [symbolQuery, setSymbolQuery] = useState("");
  const [quoteState, setQuoteState] = useState<QuoteResponse>({});
  const [clockState, setClockState] = useState<ClockResponse>({});
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [range, setRange] = useState("All");
  const [marketRange, setMarketRange] = useState("1D");
  const [depositDraft, setDepositDraft] = useState({
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    category: "",
    sourceLabel: "Manual Deposit",
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

  const clock = quoteState.clock ?? clockState.clock ?? null;
  const providerConnected = Boolean(clockState.clock || quoteState.quote);
  const lastUpdated = quoteState.quote?.source.asOf ?? clock?.timestamp ?? null;

  useEffect(() => {
    const controller = new AbortController();

    async function loadClock() {
      try {
        const response = await fetch("/api/market-data/clock", { signal: controller.signal });
        const payload = (await response.json()) as ClockResponse;

        if (!response.ok) {
          setClockState({ error: payload.error ?? "Market clock request failed.", code: payload.code });
          return;
        }

        setClockState(payload);
      } catch {
        if (!controller.signal.aborted) {
          setClockState({ error: "Unable to reach the market-data route.", code: "NETWORK_ERROR" });
        }
      }
    }

    void loadClock();

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

      if (!response.ok) {
        setQuoteState({ error: payload.error ?? "Market data request failed.", code: payload.code });
        return;
      }

      setQuoteState(payload);
      setSymbolQuery(normalized);
      setSearchResults([]);
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
    <main className="h-dvh overflow-hidden bg-[#070b10] text-[#e7edf4]">
      <div className="grid h-dvh grid-rows-[52px_minmax(0,1fr)_40px]">
        <TopHeader
          symbolQuery={symbolQuery}
          setSymbolQuery={setSymbolQuery}
          clock={clock}
          providerConnected={providerConnected}
          providerError={clockState.error}
          lastUpdated={lastUpdated}
          isLoadingQuote={isLoadingQuote}
          onQuote={() => loadQuote()}
          onSearch={searchSymbols}
        />

        <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[188px_minmax(0,1fr)] xl:grid-cols-[188px_minmax(0,1fr)_360px]">
          <LeftSidebar activeSection={activeSection} setActiveSection={setActiveSection} summary={summary} />

          <section className="min-h-0 min-w-0 overflow-auto border-r border-[#67809640] px-4 py-3 terminal-scroll xl:overflow-hidden">
            <Overview summary={summary} range={range} setRange={setRange} />
          </section>

          <RightRail
            symbolQuery={symbolQuery}
            setSymbolQuery={setSymbolQuery}
            quoteState={quoteState}
            searchResults={searchResults}
            clock={clock}
            marketRange={marketRange}
            setMarketRange={setMarketRange}
            isLoadingQuote={isLoadingQuote}
            isSearching={isSearching}
            onQuote={loadQuote}
            onSearch={searchSymbols}
            depositDraft={depositDraft}
            setDepositDraft={setDepositDraft}
          />
        </div>

        <TerminalFooter />
      </div>
    </main>
  );
}

function TopHeader({
  symbolQuery,
  setSymbolQuery,
  clock,
  providerConnected,
  providerError,
  lastUpdated,
  isLoadingQuote,
  onQuote,
  onSearch,
}: {
  symbolQuery: string;
  setSymbolQuery: (value: string) => void;
  clock: MarketClock | null;
  providerConnected: boolean;
  providerError?: string;
  lastUpdated: string | null;
  isLoadingQuote: boolean;
  onQuote: () => void;
  onSearch: () => void;
}) {
  return (
    <header className="grid min-w-0 grid-cols-[188px_minmax(320px,420px)_minmax(0,1fr)] items-center border-b border-[#67809640] bg-[#070b10]">
      <div className="flex items-center gap-3 px-4">
        <LogoMark />
        <span className="truncate text-[16px] font-semibold tracking-[-0.01em] text-white">Proof Portfolio</span>
      </div>

      <div className="flex min-w-0 items-center rounded-[4px] border border-[#6780964d] bg-[#0d141d] px-2">
        <Search className="size-4 shrink-0 text-[#8997a8]" />
        <input
          className="h-[34px] min-w-0 flex-1 bg-transparent px-3 text-[12px] text-[#e7edf4] outline-none placeholder:text-[#7a8796]"
          value={symbolQuery}
          placeholder="Search symbols (e.g., AAPL, SPY, TSLA)"
          onChange={(event) => setSymbolQuery(event.target.value.toUpperCase())}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onQuote();
              onSearch();
            }
          }}
        />
        <kbd className="rounded-[3px] border border-[#67809640] bg-[#101822] px-1.5 py-0.5 font-mono text-[11px] text-[#8794a4]">/</kbd>
      </div>

      <div className="flex min-w-0 items-center justify-end gap-4 px-4 text-[12px] text-[#c6d0dc]">
        <StatusBlock
          dotTone={clock?.isOpen ? "positive" : "negative"}
          label={marketStatusLabel(clock, providerError)}
          detail={marketStatusDetail(clock, providerError)}
        />
        <HeaderDivider />
        <StatusBlock
          dotTone={providerConnected ? "positive" : "warning"}
          label="Data: Alpaca"
          detail={providerConnected ? "Connected" : providerError ? "Degraded" : "Checking"}
        />
        <HeaderDivider />
        <span className="whitespace-nowrap font-mono text-[12px] text-[#c6d0dc]">
          Last updated: {lastUpdated ? formatTimestamp(lastUpdated, "time") : isLoadingQuote ? "Loading" : "Pending"}
        </span>
        <HeaderDivider />
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-[#1b2531] font-mono text-[12px] text-white">PP</div>
          <div className="hidden min-w-0 xl:block">
            <p className="truncate text-[12px] font-semibold text-white">Proof Portfolio</p>
            <p className="text-[12px] text-[#c6d0dc]">Individual</p>
          </div>
          <ChevronDown className="size-4 text-[#c6d0dc]" />
        </div>
      </div>
    </header>
  );
}

function LeftSidebar({
  activeSection,
  setActiveSection,
  summary,
}: {
  activeSection: string;
  setActiveSection: (value: string) => void;
  summary: ProofPortfolioSummary;
}) {
  return (
    <aside className="hidden min-h-0 border-r border-[#67809640] bg-[#070b10] lg:grid lg:grid-rows-[minmax(0,1fr)_244px]">
      <nav className="space-y-2 px-1 py-2">
        {navItems.map(([label, Icon]) => (
          <button
            key={label}
            className={`flex h-[44px] w-full items-center gap-3 rounded-[4px] px-4 text-left text-[13px] font-medium transition ${
              activeSection === label
                ? "bg-[#162130] text-white"
                : "text-[#c2ccd8] hover:bg-[#0d141d] hover:text-white"
            }`}
            onClick={() => setActiveSection(label)}
          >
            <Icon className="size-[18px] shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </nav>

      <div className="space-y-2 border-t border-[#67809633] p-1 pb-3">
        <div className="rounded-[4px] border border-[#67809640] bg-[#090e14] p-3 text-[12px]">
          <SidebarValue label="Buying Power" value={currency(summary.cashAvailable)} />
          <SidebarValue label="Day Trades (0,0,0,0)" value="-" />
          <SidebarValue label="Cash Balance" value={currency(summary.cashAvailable)} />
        </div>

        <div className="rounded-[4px] border border-[#67809640] bg-[#090e14] p-3">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-white">
            <span className="size-2 rounded-full bg-[#22d487]" />
            Paper Trading
          </div>
          <p className="mt-1 pl-4 text-[12px] text-[#9aa7b7]">Simulation Mode</p>
        </div>

        <button className="flex h-10 w-full items-center gap-3 rounded-[4px] px-4 text-left text-[12px] text-[#c2ccd8] hover:bg-[#0d141d]">
          <ChevronLeft className="size-4" />
          Collapse
        </button>
      </div>
    </aside>
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
    { label: "Total Portfolio Value", value: currency(summary.totalPortfolioValue), support: "$0.00 (0.00%)", tone: "neutral" },
    { label: "Cash Available", value: currency(summary.cashAvailable), tone: "neutral" },
    { label: "Invested Market Value", value: currency(summary.investedMarketValue), tone: "neutral" },
    { label: "Today's P/L", value: zeroCurrency(summary.todayPnl), support: percent(summary.todayPnl), tone: valueTone(summary.todayPnl) },
    {
      label: "Total Realized P/L",
      value: zeroCurrency(summary.totalRealizedPnl),
      support: percent(summary.totalRealizedPnl),
      tone: valueTone(summary.totalRealizedPnl),
    },
    {
      label: "Total Unrealized P/L",
      value: zeroCurrency(summary.totalUnrealizedPnl),
      support: percent(summary.totalUnrealizedPnl),
      tone: valueTone(summary.totalUnrealizedPnl),
    },
    { label: "Net Contributions", value: currency(summary.netContributions), tone: "neutral" },
    { label: "Trading Return", value: "0.00%", support: "(Excluding Deposits)", tone: "neutral", info: true },
    { label: "Time-Weighted Return", value: percent(summary.timeWeightedReturn).replace("+", ""), tone: valueTone(summary.timeWeightedReturn), info: true },
    { label: "Benchmark (vs SPY)", value: percent(summary.benchmarkReturn).replace("+", ""), tone: valueTone(summary.benchmarkReturn), info: true },
  ];

  return (
    <div className="mx-auto flex h-full max-w-[920px] flex-col">
      <h1 className="mb-2 text-[22px] font-semibold tracking-[-0.02em] text-white">Overview</h1>

      <div className="grid grid-cols-2 gap-[10px] xl:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <section className="mt-[10px] rounded-[4px] border border-[#67809640] bg-[#0d141d] p-3">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-white">Portfolio Equity Curve</h2>
              <Info className="size-3.5 text-[#8b98a8]" />
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-[#a5b0bf]">
              <Legend swatch="bg-[#4ea3ff]" label="Portfolio Value" />
              <Legend swatch="border-t border-dashed border-[#8a96a6]" label="Net Contributed Capital" />
              <Legend swatch="bg-[#9b7cff]" label="SPY (Benchmark)" />
            </div>
          </div>
          <SegmentedControl options={rangeOptions} value={range} onChange={setRange} />
        </div>
        <EquityChart />
      </section>

      <div className="mt-[10px] grid min-h-0 flex-1 grid-cols-[minmax(0,1.35fr)_minmax(260px,0.85fr)] gap-[10px]">
        <RecentTrades />
        <ProofScorecard />
      </div>
    </div>
  );
}

function RightRail({
  symbolQuery,
  setSymbolQuery,
  quoteState,
  searchResults,
  clock,
  marketRange,
  setMarketRange,
  isLoadingQuote,
  isSearching,
  onQuote,
  onSearch,
  depositDraft,
  setDepositDraft,
}: {
  symbolQuery: string;
  setSymbolQuery: (value: string) => void;
  quoteState: QuoteResponse;
  searchResults: SearchResult[];
  clock: MarketClock | null;
  marketRange: string;
  setMarketRange: (value: string) => void;
  isLoadingQuote: boolean;
  isSearching: boolean;
  onQuote: (symbol?: string) => void;
  onSearch: () => void;
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
    <aside className="hidden min-h-0 space-y-[10px] overflow-hidden bg-[#070b10] p-[8px] xl:block">
      <MarketPanel
        symbolQuery={symbolQuery}
        setSymbolQuery={setSymbolQuery}
        quoteState={quoteState}
        searchResults={searchResults}
        clock={clock}
        marketRange={marketRange}
        setMarketRange={setMarketRange}
        isLoadingQuote={isLoadingQuote}
        isSearching={isSearching}
        onQuote={onQuote}
        onSearch={onSearch}
      />
      <DepositPanel depositDraft={depositDraft} setDepositDraft={setDepositDraft} />
    </aside>
  );
}

function MarketPanel({
  symbolQuery,
  setSymbolQuery,
  quoteState,
  searchResults,
  clock,
  marketRange,
  setMarketRange,
  isLoadingQuote,
  isSearching,
  onQuote,
  onSearch,
}: {
  symbolQuery: string;
  setSymbolQuery: (value: string) => void;
  quoteState: QuoteResponse;
  searchResults: SearchResult[];
  clock: MarketClock | null;
  marketRange: string;
  setMarketRange: (value: string) => void;
  isLoadingQuote: boolean;
  isSearching: boolean;
  onQuote: (symbol?: string) => void;
  onSearch: () => void;
}) {
  const quote = quoteState.quote;

  return (
    <section className="h-[52%] min-h-[478px] overflow-hidden rounded-[4px] border border-[#67809640] bg-[#0d141d]">
      <PanelTabs left="Markets" right="Watchlist" />

      <div className="space-y-3 p-2">
        <div className="grid grid-cols-[minmax(0,1fr)_148px] gap-2">
          <div className="flex h-8 items-center rounded-[4px] border border-[#67809640] bg-[#111a25] px-2">
            <Search className="size-4 text-[#8794a4]" />
            <input
              className="min-w-0 flex-1 bg-transparent px-2 text-[12px] text-white outline-none placeholder:text-[#778494]"
              value={symbolQuery}
              placeholder="Search symbol"
              onChange={(event) => setSymbolQuery(event.target.value.toUpperCase())}
              onBlur={onSearch}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onQuote();
                  onSearch();
                }
              }}
            />
            {isLoadingQuote || isSearching ? <Loader2 className="size-3.5 animate-spin text-[#8ea0b4]" /> : null}
          </div>
          <button className="flex h-8 items-center justify-between rounded-[4px] border border-[#67809640] bg-[#111a25] px-3 text-[12px] text-[#d5deea]">
            <span className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#22d487]" />
              IEX real-time
            </span>
            <ChevronDown className="size-3.5" />
          </button>
        </div>

        {quoteState.error ? (
          <div className="rounded-[4px] border border-[#c7973540] bg-[#2b220d] px-3 py-2 text-[12px] text-[#dfc27c]">
            {quoteState.error}
          </div>
        ) : null}

        {searchResults.length ? (
          <div className="max-h-24 overflow-auto rounded-[4px] border border-[#67809640] bg-[#0a1017] terminal-scroll">
            {searchResults.map((result) => (
              <button
                key={result.symbol}
                className="block w-full border-b border-[#67809622] px-3 py-2 text-left hover:bg-[#142033]"
                onMouseDown={() => onQuote(result.symbol)}
              >
                <span className="font-mono text-[12px] text-white">{result.symbol}</span>
                <span className="ml-2 text-[11px] text-[#8794a4]">{result.exchange ?? result.assetType}</span>
                <p className="truncate text-[11px] text-[#a8b3c0]">{result.name}</p>
              </button>
            ))}
          </div>
        ) : null}

        <div className="rounded-[4px] border border-[#67809626] bg-[#0a1017]">
          <div className="grid grid-cols-[1fr_1px_140px] gap-3 p-3">
            <div>
              <p className="font-mono text-[19px] font-semibold text-white">{quote?.symbol ?? "-"}</p>
              <p className="mt-3 font-mono text-[12px] text-[#9aa7b7]">{quote ? nullableCurrency(quote.mark) : "-"}</p>
              <p className={`mt-1 font-mono text-[12px] ${valueClass(quote?.dayChange ?? 0)}`}>
                {quote?.dayChange === undefined || quote.dayChange === null
                  ? "- (-%)"
                  : `${signedCurrency(quote.dayChange)} (${percent(quote.dayChangePercent ?? 0)})`}
              </p>
            </div>
            <div className="bg-[#67809626]" />
            <div className="space-y-2 text-[12px]">
              <QuoteLine label="Bid" value={quote ? nullableCurrency(quote.bid) : "-"} />
              <QuoteLine label="Ask" value={quote ? nullableCurrency(quote.ask) : "-"} />
              <QuoteLine label="Vol" value={quote?.volume === null || !quote ? "-" : quote.volume.toLocaleString()} />
            </div>
          </div>

          <div className="flex items-center justify-between px-3 pb-3">
            <SegmentedControl options={marketRangeOptions} value={marketRange} onChange={setMarketRange} compact />
            <button className="rounded-[4px] border border-[#67809640] bg-[#111a25] p-2 text-[#a8b3c0]">
              <BarChart3 className="size-3.5" />
            </button>
          </div>

          <div className="relative mx-3 h-[248px] border-t border-[#67809626] chart-grid">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-[12px] text-[#9aa7b7]">
              <Search className="size-7 text-[#7c8998]" />
              {quote ? "Chart history will render from provider bars." : "Enter a symbol to view quote"}
            </div>
          </div>

          <div className="flex h-9 items-center justify-between border-t border-[#67809626] px-3 font-mono text-[11px] text-[#9aa7b7]">
            <span className="flex items-center gap-2">
              <span className={`size-1.5 rounded-full ${clock?.isOpen ? "bg-[#22d487]" : "bg-[#ff5a5f]"}`} />
              {marketStatusLabel(clock)}
            </span>
            <span>{formatTimestamp(quote?.source.asOf ?? clock?.timestamp ?? null, "time")}</span>
          </div>
        </div>
      </div>
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
    <section className="h-[calc(48%-10px)] min-h-[368px] overflow-hidden rounded-[4px] border border-[#67809640] bg-[#0d141d]">
      <div className="flex h-9 items-center justify-between border-b border-[#67809633] px-3">
        <h2 className="text-[14px] font-semibold text-white">Deposits & Cash</h2>
        <ChevronUp className="size-4 text-[#c6d0dc]" />
      </div>

      <div className="p-2">
        <div className="grid grid-cols-2 overflow-hidden rounded-[4px] border border-[#67809626] bg-[#0a1017] text-[12px]">
          <button className="h-7 bg-[#172232] font-medium text-white">Deposit Funds</button>
          <button className="h-7 text-[#9aa7b7]">Transfer</button>
        </div>

        <div className="mt-2 space-y-1.5 text-[12px]">
          <FormField label="Amount (USD)">
            <div className="flex h-7 items-center rounded-[4px] border border-[#67809640] bg-[#111a25] px-3">
              <span className="mr-2 font-mono text-[#9aa7b7]">$</span>
              <input
                className="min-w-0 flex-1 bg-transparent font-mono text-[12px] text-white outline-none placeholder:text-[#6f7c8c]"
                inputMode="decimal"
                value={depositDraft.amount}
                placeholder="0.00"
                onChange={(event) => setDepositDraft((current) => ({ ...current, amount: event.target.value }))}
              />
            </div>
          </FormField>

          <FormField label="Date">
            <input
              className="h-7 w-full rounded-[4px] border border-[#67809640] bg-[#111a25] px-3 font-mono text-[12px] text-[#d7e0eb] outline-none"
              type="date"
              value={depositDraft.date}
              onChange={(event) => setDepositDraft((current) => ({ ...current, date: event.target.value }))}
            />
          </FormField>

          <FormField label="Category">
            <select
              className="h-7 w-full rounded-[4px] border border-[#67809640] bg-[#111a25] px-3 text-[12px] text-[#d7e0eb] outline-none"
              value={depositDraft.category}
              onChange={(event) => setDepositDraft((current) => ({ ...current, category: event.target.value }))}
            >
              <option value="">Select category</option>
              <option value="paycheck">Paycheck</option>
              <option value="bonus">Bonus</option>
              <option value="manual contribution">Manual Contribution</option>
              <option value="correction">Correction</option>
            </select>
          </FormField>

          <FormField label="Source">
            <select
              className="h-7 w-full rounded-[4px] border border-[#67809640] bg-[#111a25] px-3 text-[12px] text-[#d7e0eb] outline-none"
              value={depositDraft.sourceLabel}
              onChange={(event) => setDepositDraft((current) => ({ ...current, sourceLabel: event.target.value }))}
            >
              <option value="Manual Deposit">Manual Deposit</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Payroll">Payroll</option>
              <option value="Correction">Correction</option>
            </select>
          </FormField>

          <FormField label="Notes (optional)">
            <input
              className="h-7 w-full rounded-[4px] border border-[#67809640] bg-[#111a25] px-3 text-[12px] text-white outline-none placeholder:text-[#6f7c8c]"
              value={depositDraft.notes}
              placeholder="Add a note for this deposit"
              onChange={(event) => setDepositDraft((current) => ({ ...current, notes: event.target.value }))}
            />
          </FormField>

          <button
            className="mt-1 h-8 w-full rounded-[4px] bg-[#2e67b7] text-[12px] font-semibold text-white hover:bg-[#3573c8]"
            type="button"
            onClick={() => window.alert("Sign in is required before recording deposits.")}
          >
            Record Deposit
          </button>
        </div>

        <button className="mt-3 flex items-center gap-2 text-[12px] text-[#c6d0dc] hover:text-white">
          View deposit history
          <ExternalLink className="size-3.5" />
        </button>
      </div>
    </section>
  );
}

function RecentTrades() {
  return (
    <section className="flex min-h-0 flex-col rounded-[4px] border border-[#67809640] bg-[#0d141d]">
      <div className="flex h-11 items-center justify-between border-b border-[#67809633] px-3">
        <h2 className="text-[15px] font-semibold text-white">Recent Trades</h2>
        <div className="grid grid-cols-3 overflow-hidden rounded-[4px] border border-[#67809633] bg-[#0a1017] text-[12px]">
          {["All", "Stocks", "Options"].map((tab) => (
            <button key={tab} className={`h-8 px-4 ${tab === "All" ? "bg-[#182332] text-white" : "text-[#a8b3c0]"}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <table className="w-full table-fixed text-[12px]">
        <thead className="h-9 bg-[#111a25] text-[#b5c0ce]">
          <tr>
            {["Time", "Symbol", "Side", "Quantity", "Type", "Price", "Status"].map((head) => (
              <th key={head} className="px-3 text-left font-medium">
                {head}
              </th>
            ))}
          </tr>
        </thead>
      </table>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
        <FileText className="mb-3 size-14 text-[#778494]" strokeWidth={1.4} />
        <p className="text-[15px] font-semibold text-white">No trades yet</p>
        <p className="mt-2 text-[12px] text-[#9aa7b7]">Your recent trades will appear here.</p>
      </div>

      <div className="flex h-10 items-center justify-between border-t border-[#67809633] px-3 text-[12px] text-[#c6d0dc]">
        <button className="hover:text-white">View all trades</button>
        <span>0 trades</span>
      </div>
    </section>
  );
}

function ProofScorecard() {
  const rows = [
    ["Total Trades", "0"],
    ["Win Rate", "0.00%"],
    ["Profit Factor", "0.00"],
    ["Avg Win", "$0.00"],
    ["Avg Loss", "$0.00"],
    ["Expectancy per Trade", "$0.00"],
    ["Max Drawdown", "0.00%"],
    ["Best Day", "$0.00 (0.00%)"],
    ["Worst Day", "$0.00 (0.00%)"],
  ];

  return (
    <section className="flex min-h-0 flex-col rounded-[4px] border border-[#67809640] bg-[#0d141d] p-3">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-[15px] font-semibold text-white">Proof Scorecard</h2>
        <Info className="size-3.5 text-[#8b98a8]" />
      </div>
      <div className="overflow-hidden rounded-[3px] border border-[#67809626]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex h-[31px] items-center justify-between border-b border-[#67809626] bg-[#111922] px-3 text-[12px] last:border-0">
            <span className="text-[#b9c4d1]">{label}</span>
            <span className={`font-mono text-white ${label === "Best Day" ? "text-[#91d66f]" : ""} ${label === "Worst Day" ? "text-[#ff666b]" : ""}`}>
              {value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-auto flex h-10 items-center border-t border-[#67809633] text-[12px]">
        <button className="flex items-center gap-2 text-[#c6d0dc] hover:text-white">
          View performance
          <ChevronRight className="size-4" />
        </button>
      </div>
    </section>
  );
}

function EquityChart() {
  const months = ["May '24", "Jun '24", "Jul '24", "Aug '24", "Sep '24", "Oct '24", "Nov '24", "Dec '24", "Jan '25", "Feb '25", "Mar '25", "Apr '25", "May '25"];
  const ticks = ["10K", "5K", "0", "-5K", "-10K"];

  return (
    <div className="relative h-[216px] overflow-hidden bg-[#0d141d]">
      <div className="absolute inset-x-0 bottom-8 top-2 grid grid-rows-5">
        {ticks.map((tick) => (
          <div key={tick} className="relative border-b border-[#67809622]">
            <span className="absolute -top-2 left-0 font-mono text-[11px] text-[#9aa7b7]">{tick}</span>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-[28px] top-[96px] border-t border-dashed border-[#8996a680]" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-[14px] font-semibold text-[#e7edf4]">No data to display.</p>
        <p className="mt-2 text-[12px] text-[#b2bdc9]">Make a deposit or place a trade to see your performance over time.</p>
      </div>
      <div className="absolute inset-x-[34px] bottom-0 flex justify-between font-mono text-[11px] text-[#9aa7b7]">
        {months.map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  support,
  tone,
  info,
}: {
  label: string;
  value: string;
  support?: string;
  tone: string;
  info?: boolean;
}) {
  return (
    <div className="h-[94px] rounded-[4px] border border-[#67809640] bg-[#0d141d] p-3 shadow-[0_8px_20px_rgba(0,0,0,0.16)]">
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#c2ccd8]">
        <span className="truncate">{label}</span>
        {info ? <Info className="size-3.5 shrink-0 text-[#8b98a8]" /> : null}
      </div>
      <p className={`mt-3 font-mono text-[20px] font-semibold leading-none ${toneClass(tone)}`}>{value}</p>
      {support ? <p className={`mt-2 font-mono text-[12px] ${supportToneClass(tone)}`}>{support}</p> : null}
    </div>
  );
}

function PanelTabs({ left, right }: { left: string; right: string }) {
  return (
    <div className="grid h-10 grid-cols-[1fr_1fr_36px] border-b border-[#67809633] text-[13px]">
      <button className="border-b-2 border-[#4ea3ff] font-semibold text-white">{left}</button>
      <button className="text-[#a8b3c0]">{right}</button>
      <button className="flex items-center justify-center text-[#c6d0dc]">
        <ChevronUp className="size-4" />
      </button>
    </div>
  );
}

function SegmentedControl({
  options,
  value,
  onChange,
  compact = false,
}: {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={`flex overflow-hidden rounded-[4px] border border-[#67809633] bg-[#0a1017] ${compact ? "border-0 bg-transparent" : ""}`}>
      {options.map((option) => (
        <button
          key={option}
          className={`${compact ? "h-8 px-2.5" : "h-8 px-3.5"} font-mono text-[12px] ${
            value === option ? "rounded-[4px] bg-[#1a2635] text-white" : "text-[#a8b3c0] hover:bg-[#111a25]"
          }`}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[11px] text-[#c2ccd8]">{label}</span>
      {children}
    </label>
  );
}

function StatusBlock({
  dotTone,
  label,
  detail,
}: {
  dotTone: "positive" | "negative" | "warning";
  label: string;
  detail: string;
}) {
  const dotClass = dotTone === "positive" ? "bg-[#22d487]" : dotTone === "negative" ? "bg-[#ff5a5f]" : "bg-[#c79735]";

  return (
    <div className="flex items-start gap-2 whitespace-nowrap">
      <span className={`mt-1 size-1.5 rounded-full ${dotClass}`} />
      <div>
        <p className="font-semibold leading-4 text-[#dce5ef]">{label}</p>
        <p className="leading-4 text-[#c6d0dc]">{detail}</p>
      </div>
    </div>
  );
}

function TerminalFooter() {
  return (
    <footer className="flex items-center justify-between border-t border-[#7a5a153f] bg-[#17170d] px-4 text-[11px] text-[#c6d0dc]">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 text-[#d5a72c]" />
        <span>Paper trading is for educational purposes only. It does not guarantee future results.</span>
      </div>
      <div className="flex items-center gap-5">
        <span>
          Data provided by <span className="text-[#4ea3ff]">Alpaca Markets</span>
        </span>
        <HeaderDivider />
        <span className="flex items-center gap-3">
          System Status
          <span className="size-1.5 rounded-full bg-[#45d66b]" />
        </span>
      </div>
    </footer>
  );
}

function LogoMark() {
  return (
    <div className="flex size-7 items-center justify-center rounded-[4px] bg-white text-[#070b10]">
      <ShieldCheck className="size-4" strokeWidth={2.4} />
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`h-0.5 w-4 ${swatch}`} />
      {label}
    </span>
  );
}

function QuoteLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[#c2ccd8]">{label}</span>
      <span className="font-mono text-white">{value}</span>
    </div>
  );
}

function SidebarValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[#c2ccd8]">{label}</span>
      <span className="font-mono text-[#e7edf4]">{value}</span>
    </div>
  );
}

function HeaderDivider() {
  return <div className="h-7 w-px bg-[#67809659]" />;
}

function nullableCurrency(value: number | null) {
  return value === null ? "-" : currency(value);
}

function zeroCurrency(value: number) {
  return value === 0 ? "$0.00" : signedCurrency(value);
}

function marketStatusLabel(clock: MarketClock | null, providerError?: string) {
  if (!clock && providerError) {
    return "Market Unavailable";
  }

  if (!clock) {
    return "Market Status";
  }

  return clock.isOpen ? "Market Open" : "Market Closed";
}

function marketStatusDetail(clock: MarketClock | null, providerError?: string) {
  if (!clock && providerError) {
    return "Configure Alpaca";
  }

  if (!clock) {
    return "Checking status";
  }

  const target = clock.isOpen ? clock.nextClose : clock.nextOpen;
  const prefix = clock.isOpen ? "Closes" : "Opens";

  return target ? `${prefix} ${relativeDuration(target)}` : formatTimestamp(clock.timestamp, "time");
}

function relativeDuration(value: string) {
  const diffMs = new Date(value).getTime() - Date.now();

  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return "soon";
  }

  const totalMinutes = Math.round(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `in ${hours}h ${minutes}m`;
  }

  return `in ${minutes}m`;
}

function formatTimestamp(value: string | null, mode: "time" | "datetime" = "datetime") {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    ...(mode === "datetime" ? { month: "short", day: "numeric" } : {}),
  }).format(new Date(value));
}

function valueTone(value: number) {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

function toneClass(tone: string) {
  if (tone === "positive") return "text-[#91d66f]";
  if (tone === "negative") return "text-[#ff666b]";
  return "text-[#f1f5f9]";
}

function supportToneClass(tone: string) {
  if (tone === "positive") return "text-[#91d66f]";
  if (tone === "negative") return "text-[#ff666b]";
  return "text-[#9aa7b7]";
}

function valueClass(value: number) {
  return value > 0 ? "text-[#91d66f]" : value < 0 ? "text-[#ff666b]" : "text-[#9aa7b7]";
}
