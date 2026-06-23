import type { AssetType } from "@/domain/types";

export type MarketQuote = {
  symbol: string;
  assetType: AssetType;
  price: number;
  asOf: string;
  provider: "mock";
};

export interface MarketDataProvider {
  getQuote(symbol: string, assetType?: AssetType): MarketQuote;
}

const mockPrices: Record<string, number> = {
  AAPL: 214.62,
  AMD: 159.18,
  AMZN: 186.33,
  COIN: 243.77,
  GOOGL: 178.91,
  META: 512.42,
  MSFT: 447.7,
  NVDA: 126.57,
  PLTR: 27.44,
  QQQ: 479.88,
  SPY: 548.11,
  TSLA: 181.24,
};

export class MockMarketDataProvider implements MarketDataProvider {
  getQuote(symbol: string, assetType: AssetType = "stock"): MarketQuote {
    const normalized = symbol.toUpperCase().trim();
    const fallback = 50 + (normalized.charCodeAt(0) % 30) * 3.17;

    return {
      symbol: normalized,
      assetType,
      price: Number((mockPrices[normalized] ?? fallback).toFixed(2)),
      asOf: new Date().toISOString(),
      provider: "mock",
    };
  }
}

export const marketDataProvider = new MockMarketDataProvider();
