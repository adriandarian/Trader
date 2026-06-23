import "server-only";

import type {
  DailyBar,
  MarketClock,
  MarketDataProvider,
  MarketQuote,
  OptionContract,
  OptionSnapshot,
  SymbolSearchResult,
} from "./types";
import { MarketDataError } from "./types";

export class MockMarketDataProvider implements MarketDataProvider {
  async searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    const symbol = query.toUpperCase().trim();

    if (!symbol) {
      return [];
    }

    return [
      {
        symbol,
        name: "Mock provider symbol. Do not use for performance proof.",
        assetType: "stock",
        tradable: false,
      },
    ];
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    throw new MarketDataError(
      `Mock market data is configured, so ${symbol.toUpperCase()} cannot be valued with real prices.`,
      503,
      "MOCK_MARKET_DATA_DISABLED",
    );
  }

  async getQuotes(): Promise<MarketQuote[]> {
    return [];
  }

  async getDailyBars(): Promise<DailyBar[]> {
    return [];
  }

  async getOptionContracts(): Promise<OptionContract[]> {
    return [];
  }

  async getOptionSnapshot(optionSymbol: string): Promise<OptionSnapshot> {
    throw new MarketDataError(
      `Mock market data is configured, so ${optionSymbol.toUpperCase()} cannot be valued with real option data.`,
      503,
      "MOCK_MARKET_DATA_DISABLED",
    );
  }

  async getMarketClock(): Promise<MarketClock> {
    return {
      isOpen: null,
      nextOpen: null,
      nextClose: null,
      timestamp: new Date().toISOString(),
    };
  }
}
