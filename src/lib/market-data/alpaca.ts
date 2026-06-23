import "server-only";

import type {
  DailyBar,
  MarketClock,
  MarketDataProvider,
  MarketQuote,
  OptionContract,
  OptionContractFilters,
  OptionSnapshot,
  SymbolSearchResult,
} from "./types";
import { MarketDataError } from "./types";
import {
  assertAlpacaReadOnlyEndpoint,
  getAlpacaOptionFeedLabel,
  getAlpacaStockFeedLabel,
} from "./alpaca-boundary";

const dataBaseUrl = "https://data.alpaca.markets";
const metadataBaseUrl = "https://paper-api.alpaca.markets";

type AlpacaQuote = {
  ap?: number;
  bp?: number;
  t?: string;
};

type AlpacaTrade = {
  p?: number;
  t?: string;
};

type AlpacaBar = {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

type AlpacaSnapshot = {
  latestQuote?: AlpacaQuote;
  latestTrade?: AlpacaTrade;
  dailyBar?: AlpacaBar;
  prevDailyBar?: AlpacaBar;
  minuteBar?: AlpacaBar;
};

export class AlpacaMarketDataProvider implements MarketDataProvider {
  private readonly stockFeed = process.env.ALPACA_STOCK_FEED ?? "iex";
  private readonly optionFeed = process.env.ALPACA_OPTION_FEED ?? "indicative";

  async searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    const normalized = normalizeSymbol(query);

    if (normalized.length < 1) {
      return [];
    }

    const assets = await this.request<Array<{ symbol: string; name: string; exchange?: string; tradable?: boolean }>>(
      `${metadataBaseUrl}/v2/assets?asset_class=us_equity&status=active`,
    );

    return assets
      .filter((asset) => {
        const symbol = asset.symbol.toUpperCase();
        const name = asset.name.toUpperCase();
        return symbol.includes(normalized) || name.includes(normalized);
      })
      .slice(0, 12)
      .map((asset) => ({
        symbol: asset.symbol,
        name: asset.name,
        exchange: asset.exchange,
        assetType: asset.name.toLowerCase().includes("etf") ? "etf" : "stock",
        tradable: asset.tradable,
      }));
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    const [quote] = await this.getQuotes([symbol]);

    if (!quote) {
      throw new MarketDataError(`No quote returned for ${symbol}.`, 404, "QUOTE_NOT_FOUND");
    }

    return quote;
  }

  async getQuotes(symbols: string[]): Promise<MarketQuote[]> {
    const normalized = symbols.map(normalizeSymbol).filter(Boolean);

    if (!normalized.length) {
      return [];
    }

    const params = new URLSearchParams({
      symbols: normalized.join(","),
      feed: this.stockFeed,
    });
    const payload = await this.request<{ snapshots: Record<string, AlpacaSnapshot> }>(
      `${dataBaseUrl}/v2/stocks/snapshots?${params.toString()}`,
    );

    return normalized.map((symbol) => mapStockSnapshot(symbol, payload.snapshots?.[symbol], this.stockFeed));
  }

  async getDailyBars(symbol: string, range: string): Promise<DailyBar[]> {
    const normalized = normalizeSymbol(symbol);
    const start = startForRange(range);
    const params = new URLSearchParams({
      timeframe: "1Day",
      start,
      feed: this.stockFeed,
    });
    const payload = await this.request<{ bars?: AlpacaBar[] }>(
      `${dataBaseUrl}/v2/stocks/${normalized}/bars?${params.toString()}`,
    );

    return (payload.bars ?? []).map((bar) => ({
      date: bar.t,
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
    }));
  }

  async getOptionContracts(underlying: string, filters: OptionContractFilters = {}): Promise<OptionContract[]> {
    const params = new URLSearchParams({
      underlying_symbols: normalizeSymbol(underlying),
      status: "active",
      limit: "100",
    });

    if (filters.expirationDateGte) params.set("expiration_date_gte", filters.expirationDateGte);
    if (filters.expirationDateLte) params.set("expiration_date_lte", filters.expirationDateLte);
    if (filters.strikeGte !== undefined) params.set("strike_price_gte", String(filters.strikeGte));
    if (filters.strikeLte !== undefined) params.set("strike_price_lte", String(filters.strikeLte));
    if (filters.type) params.set("type", filters.type);

    const payload = await this.request<{
      option_contracts?: Array<{
        symbol: string;
        underlying_symbol: string;
        type: "call" | "put";
        strike_price: string;
        expiration_date: string;
      }>;
    }>(`${metadataBaseUrl}/v2/options/contracts?${params.toString()}`);

    return (payload.option_contracts ?? []).map((contract) => ({
      symbol: contract.symbol,
      underlying: contract.underlying_symbol,
      optionType: contract.type,
      strike: Number(contract.strike_price),
      expirationDate: contract.expiration_date,
      multiplier: 100,
    }));
  }

  async getOptionSnapshot(optionSymbol: string): Promise<OptionSnapshot> {
    const params = new URLSearchParams({
      symbols: normalizeSymbol(optionSymbol),
      feed: this.optionFeed,
    });
    const payload = await this.request<{
      snapshots?: Record<
        string,
        {
          latestQuote?: AlpacaQuote;
          latestTrade?: AlpacaTrade;
          greeks?: Record<string, number | null>;
        }
      >;
    }>(`${dataBaseUrl}/v1beta1/options/snapshots?${params.toString()}`);
    const normalized = normalizeSymbol(optionSymbol);
    const snapshot = payload.snapshots?.[normalized];

    if (!snapshot) {
      throw new MarketDataError(
        "Options data is unavailable for this contract. Enable the required Alpaca options feed to view snapshots.",
        404,
        "OPTIONS_FEED_UNAVAILABLE",
      );
    }

    const bid = snapshot.latestQuote?.bp ?? null;
    const ask = snapshot.latestQuote?.ap ?? null;
    const last = snapshot.latestTrade?.p ?? null;

    return {
      symbol: normalized,
      bid,
      ask,
      last,
      mark: bid !== null && ask !== null ? midpoint(bid, ask) : last,
      greeks: snapshot.greeks,
      source: {
        provider: "alpaca",
        feed: this.optionFeed,
        label: getAlpacaOptionFeedLabel(this.optionFeed),
        asOf: snapshot.latestQuote?.t ?? snapshot.latestTrade?.t ?? null,
        isRealtime: this.optionFeed !== "indicative",
      },
    };
  }

  async getMarketClock(): Promise<MarketClock> {
    const payload = await this.request<{ is_open: boolean; next_open: string; next_close: string }>(
      `${metadataBaseUrl}/v2/clock`,
    );

    return {
      isOpen: payload.is_open,
      nextOpen: payload.next_open,
      nextClose: payload.next_close,
      timestamp: new Date().toISOString(),
    };
  }

  private async request<T>(url: string): Promise<T> {
    assertAlpacaReadOnlyEndpoint(url);

    const key = process.env.ALPACA_API_KEY;
    const secret = process.env.ALPACA_API_SECRET;

    if (!key || !secret) {
      throw new MarketDataError(
        "Alpaca market data is not configured. Set ALPACA_API_KEY and ALPACA_API_SECRET on the server.",
        503,
        "ALPACA_NOT_CONFIGURED",
      );
    }

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "APCA-API-KEY-ID": key,
        "APCA-API-SECRET-KEY": secret,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new MarketDataError(
        body || `Alpaca request failed with ${response.status}.`,
        response.status,
        "ALPACA_REQUEST_FAILED",
      );
    }

    return (await response.json()) as T;
  }
}

function mapStockSnapshot(symbol: string, snapshot: AlpacaSnapshot | undefined, feed: string): MarketQuote {
  const bid = snapshot?.latestQuote?.bp ?? null;
  const ask = snapshot?.latestQuote?.ap ?? null;
  const last = snapshot?.latestTrade?.p ?? null;
  const daily = snapshot?.dailyBar;
  const previous = snapshot?.prevDailyBar;
  const mark = bid !== null && ask !== null ? midpoint(bid, ask) : last;
  const previousClose = previous?.c ?? null;
  const dayChange = mark !== null && previousClose !== null ? round(mark - previousClose) : null;

  return {
    symbol,
    bid,
    ask,
    last,
    mark,
    dayChange,
    dayChangePercent:
      dayChange !== null && previousClose !== null && previousClose !== 0 ? round((dayChange / previousClose) * 100) : null,
    dayHigh: daily?.h ?? null,
    dayLow: daily?.l ?? null,
    volume: daily?.v ?? null,
    source: {
      provider: "alpaca",
      feed,
      label: getAlpacaStockFeedLabel(feed),
      asOf: snapshot?.latestQuote?.t ?? snapshot?.latestTrade?.t ?? null,
      isRealtime: true,
    },
  };
}

function normalizeSymbol(symbol: string) {
  return symbol.toUpperCase().trim();
}

function midpoint(bid: number, ask: number) {
  return round((bid + ask) / 2);
}

function round(value: number) {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

function startForRange(range: string) {
  const now = new Date();
  const days =
    range === "1W" ? 7 : range === "1M" ? 31 : range === "3M" ? 93 : range === "YTD" ? dayOfYear(now) : 365;
  const start = new Date(now);
  start.setDate(now.getDate() - days);
  return start.toISOString();
}

function dayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}
