"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";

import { fixtureQuote } from "../design-fixtures";
import { currency, formatNumber, formatTimestamp, percent, signedCurrency } from "../format";
import { ChartFrame, DataStatusBadge, EmptyState, SegmentedControl, TerminalPanel } from "../terminal-ui";

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

export function MarketsWorkspace({ fixture, initialSymbol }: { fixture: boolean; initialSymbol?: string }) {
  const [symbolQuery, setSymbolQuery] = useState(initialSymbol ?? "");
  const [quoteState, setQuoteState] = useState<QuoteResponse>({});
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!fixture && initialSymbol) {
      void loadQuote(initialSymbol);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixture, initialSymbol]);

  async function loadQuote(symbol = symbolQuery) {
    const normalized = symbol.trim().toUpperCase();
    if (!normalized || fixture) return;

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
    if (!query || fixture) {
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

  const quote = fixture ? fixtureQuote : null;
  const runtimeQuote = quoteState.quote;
  const symbol = quote?.symbol ?? runtimeQuote?.symbol ?? (symbolQuery.trim().toUpperCase() || "-");
  const mark = quote?.last ?? runtimeQuote?.mark ?? runtimeQuote?.last ?? null;
  const change = quote?.change ?? runtimeQuote?.dayChange ?? null;
  const changePercent = quote?.changePercent ?? runtimeQuote?.dayChangePercent ?? null;
  const source = quote?.source ?? runtimeQuote?.source.label ?? "Alpaca";
  const asOf = quote?.timestamp ?? runtimeQuote?.source.asOf ?? null;

  return (
    <div className="mx-auto min-h-full max-w-[1180px]" data-testid="route-content">
      <h1 className="mb-2 text-[22px] font-semibold tracking-[-0.02em] text-white">Markets</h1>
      <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-[10px]">
        <div className="space-y-[10px]">
          <TerminalPanel
            title="Market Research"
            action={<DataStatusBadge label={fixture ? "Fixture quote" : runtimeQuote ? "Live provider response" : "Awaiting provider"} tone={fixture ? "warning" : runtimeQuote ? "positive" : "neutral"} />}
          >
            <div className="space-y-3 p-3">
              <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-2">
                <div className="flex h-9 items-center rounded-[4px] border border-[#67809640] bg-[#111a25] px-2">
                  <Search className="size-4 text-[#8794a4]" />
                  <input
                    className="min-w-0 flex-1 bg-transparent px-2 text-[12px] text-white outline-none placeholder:text-[#778494]"
                    value={fixture ? fixtureQuote.symbol : symbolQuery}
                    placeholder="Search symbol"
                    onBlur={searchSymbols}
                    onChange={(event) => setSymbolQuery(event.target.value.toUpperCase())}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void loadQuote();
                        void searchSymbols();
                      }
                    }}
                    readOnly={fixture}
                  />
                  {isLoadingQuote || isSearching ? <Loader2 className="size-3.5 animate-spin text-[#8ea0b4]" /> : null}
                </div>
                <button className="rounded-[4px] bg-[#2e67b7] text-[12px] font-semibold text-white" onClick={() => void loadQuote()} type="button">
                  Load Quote
                </button>
              </div>

              {searchResults.length ? (
                <div className="max-h-28 overflow-auto rounded-[4px] border border-[#67809640] bg-[#0a1017] terminal-scroll">
                  {searchResults.map((result) => (
                    <button
                      key={result.symbol}
                      className="block w-full border-b border-[#67809622] px-3 py-2 text-left hover:bg-[#142033]"
                      onMouseDown={() => void loadQuote(result.symbol)}
                      type="button"
                    >
                      <span className="font-mono text-[12px] text-white">{result.symbol}</span>
                      <span className="ml-2 text-[11px] text-[#8794a4]">{result.exchange ?? result.assetType}</span>
                      <p className="truncate text-[11px] text-[#a8b3c0]">{result.name}</p>
                    </button>
                  ))}
                </div>
              ) : null}

              {quoteState.error ? (
                <div className="rounded-[4px] border border-[#c7973540] bg-[#2b220d] px-3 py-2 text-[12px] text-[#dfc27c]">{quoteState.error}</div>
              ) : null}
            </div>
          </TerminalPanel>

          <TerminalPanel
            title="Quote"
            action={
              <Link className="rounded-[4px] bg-[#2e67b7] px-3 py-2 text-[12px] font-semibold text-white" href={`/trade?symbol=${encodeURIComponent(symbol === "-" ? "SPY" : symbol)}`}>
                Trade this symbol
              </Link>
            }
          >
            {fixture || runtimeQuote ? (
              <div className="grid grid-cols-[minmax(0,1fr)_260px] gap-4 p-3">
                <div>
                  <p className="font-mono text-[26px] font-semibold text-white">{symbol}</p>
                  <p className="mt-1 text-[13px] text-[#9aa7b7]">{quote?.name ?? "Provider instrument"}</p>
                  <div className="mt-5 grid grid-cols-4 gap-3 text-[12px]">
                    <QuoteBlock label="Last" value={mark === null ? "-" : currency(mark)} />
                    <QuoteBlock label="Change" value={change === null ? "-" : signedCurrency(change)} tone={(change ?? 0) >= 0 ? "text-[#91d66f]" : "text-[#ff666b]"} />
                    <QuoteBlock label="Bid" value={currency(quote?.bid ?? runtimeQuote?.bid ?? 0)} />
                    <QuoteBlock label="Ask" value={currency(quote?.ask ?? runtimeQuote?.ask ?? 0)} />
                    <QuoteBlock label="Volume" value={formatNumber(quote?.volume ?? runtimeQuote?.volume ?? 0)} />
                    <QuoteBlock label="Timestamp" value={formatTimestamp(asOf)} />
                    <QuoteBlock label="Source" value={source} />
                    <QuoteBlock label="% Move" value={changePercent === null ? "-" : percent(changePercent)} tone={(changePercent ?? 0) >= 0 ? "text-[#91d66f]" : "text-[#ff666b]"} />
                  </div>
                </div>
                <div className="rounded-[4px] border border-[#67809626] bg-[#0a1017] p-3">
                  <p className="text-[12px] font-semibold text-white">Watchlist</p>
                  {["SPY", "QQQ", "NVDA", "AAPL", "MSFT"].map((item) => (
                    <div key={item} className="mt-2 flex items-center justify-between border-b border-[#67809622] pb-2 text-[12px]">
                      <span className="font-mono text-white">{item}</span>
                      <span className="text-[#9aa7b7]">Monitor</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                icon="search"
                title="No quote loaded"
                body="Search a symbol to request actual Alpaca results. If credentials are missing, the API returns a provider-connection message instead of fake prices."
              />
            )}
          </TerminalPanel>

          <TerminalPanel title="Price Chart" action={<SegmentedControl options={["1D", "5D", "1M", "3M", "1Y", "5Y", "All"]} value="1D" />}>
            <ChartFrame height="h-[290px]">
              {fixture || runtimeQuote ? <div className="absolute inset-x-[82px] bottom-[88px] h-[112px] border-l-2 border-t-2 border-[#4ea3ff]" /> : null}
            </ChartFrame>
          </TerminalPanel>
        </div>

        <TerminalPanel title="Provider Connection">
          <div className="space-y-3 p-3 text-[12px]">
            <p className="leading-5 text-[#c2ccd8]">
              Runtime market data flows through server-side API routes backed by the existing provider abstraction. Fixture screenshots are visually watermarked and do not feed runtime portfolio state.
            </p>
            <DataStatusBadge label={fixture ? "Fixture mode active" : runtimeQuote ? "Quote response received" : "No quote response"} tone={fixture ? "warning" : runtimeQuote ? "positive" : "neutral"} />
            <div className="rounded-[4px] border border-[#67809626] bg-[#0a1017] p-3">
              <p className="font-semibold text-white">Research workflow</p>
              <p className="mt-2 text-[#9aa7b7]">Search, confirm bid/ask/source freshness, then open Trade with the selected symbol.</p>
            </div>
          </div>
        </TerminalPanel>
      </div>
    </div>
  );
}

function QuoteBlock({ label, value, tone = "text-white" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-[4px] border border-[#67809626] bg-[#0a1017] p-3">
      <p className="text-[#9aa7b7]">{label}</p>
      <p className={`mt-2 truncate font-mono ${tone}`}>{value}</p>
    </div>
  );
}
