import { describe, expect, it } from "vitest";

import {
  assertAlpacaReadOnlyEndpoint,
  getAlpacaOptionFeedLabel,
  getAlpacaStockFeedLabel,
} from "./alpaca-boundary";

describe("Alpaca read-only market-data boundary", () => {
  it("allows only market-data, symbol discovery, contracts, and clock endpoints", () => {
    expect(() => assertAlpacaReadOnlyEndpoint("https://data.alpaca.markets/v2/stocks/snapshots?symbols=SPY&feed=iex")).not.toThrow();
    expect(() => assertAlpacaReadOnlyEndpoint("https://data.alpaca.markets/v2/stocks/SPY/bars?timeframe=1Day&feed=iex")).not.toThrow();
    expect(() => assertAlpacaReadOnlyEndpoint("https://data.alpaca.markets/v1beta1/options/snapshots?symbols=SPY260116C00500000&feed=indicative")).not.toThrow();
    expect(() => assertAlpacaReadOnlyEndpoint("https://paper-api.alpaca.markets/v2/assets?asset_class=us_equity&status=active")).not.toThrow();
    expect(() => assertAlpacaReadOnlyEndpoint("https://paper-api.alpaca.markets/v2/options/contracts?underlying_symbols=SPY")).not.toThrow();
    expect(() => assertAlpacaReadOnlyEndpoint("https://paper-api.alpaca.markets/v2/clock")).not.toThrow();
  });

  it("blocks trading, account, funding, transfer, and position endpoints", () => {
    const forbiddenUrls = [
      "https://paper-api.alpaca.markets/v2/orders",
      "https://paper-api.alpaca.markets/v2/account",
      "https://paper-api.alpaca.markets/v2/account/activities",
      "https://paper-api.alpaca.markets/v2/positions",
      "https://paper-api.alpaca.markets/v2/positions/SPY",
      "https://paper-api.alpaca.markets/v2/transfers",
      "https://paper-api.alpaca.markets/v2/funding_wallets",
      "https://api.alpaca.markets/v2/orders",
    ];

    for (const url of forbiddenUrls) {
      expect(() => assertAlpacaReadOnlyEndpoint(url)).toThrow(/not an allowed read-only market-data endpoint/i);
    }
  });

  it("labels the free Basic feeds explicitly", () => {
    expect(getAlpacaStockFeedLabel("iex")).toBe("IEX real-time");
    expect(getAlpacaOptionFeedLabel("indicative")).toBe("Indicative options feed");
  });
});
