import "server-only";

import { AlpacaMarketDataProvider } from "./alpaca";
import { MockMarketDataProvider } from "./mock";
import type { MarketDataProvider, MarketDataProviderName } from "./types";

let provider: MarketDataProvider | null = null;

export function getMarketDataProvider() {
  if (!provider) {
    provider = createMarketDataProvider();
  }

  return provider;
}

function createMarketDataProvider(): MarketDataProvider {
  const configuredProvider = (process.env.MARKET_DATA_PROVIDER ?? "alpaca").toLowerCase() as MarketDataProviderName;

  if (configuredProvider === "mock") {
    return new MockMarketDataProvider();
  }

  return new AlpacaMarketDataProvider();
}
