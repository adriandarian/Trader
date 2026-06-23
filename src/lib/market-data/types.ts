export type MarketDataProviderName = "alpaca" | "mock";

export type DataQuality = {
  provider: MarketDataProviderName;
  feed: string;
  label: string;
  asOf: string | null;
  isRealtime: boolean;
};

export type SymbolSearchResult = {
  symbol: string;
  name: string;
  exchange?: string;
  assetType: "stock" | "etf" | "option";
  tradable?: boolean;
};

export type MarketQuote = {
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
  source: DataQuality;
};

export type DailyBar = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type OptionContract = {
  symbol: string;
  underlying: string;
  optionType: "call" | "put";
  strike: number;
  expirationDate: string;
  multiplier: number;
};

export type OptionSnapshot = {
  symbol: string;
  bid: number | null;
  ask: number | null;
  last: number | null;
  mark: number | null;
  greeks?: Record<string, number | null>;
  source: DataQuality;
};

export type MarketClock = {
  isOpen: boolean | null;
  nextOpen: string | null;
  nextClose: string | null;
  timestamp: string;
};

export type OptionContractFilters = {
  expirationDateGte?: string;
  expirationDateLte?: string;
  strikeGte?: number;
  strikeLte?: number;
  type?: "call" | "put";
};

export interface MarketDataProvider {
  searchSymbols(query: string): Promise<SymbolSearchResult[]>;
  getQuote(symbol: string): Promise<MarketQuote>;
  getQuotes(symbols: string[]): Promise<MarketQuote[]>;
  getDailyBars(symbol: string, range: string): Promise<DailyBar[]>;
  getOptionContracts(underlying: string, filters?: OptionContractFilters): Promise<OptionContract[]>;
  getOptionSnapshot(optionSymbol: string): Promise<OptionSnapshot>;
  getMarketClock(): Promise<MarketClock>;
}

export class MarketDataError extends Error {
  constructor(
    message: string,
    public readonly status = 502,
    public readonly code = "MARKET_DATA_ERROR",
  ) {
    super(message);
  }
}
