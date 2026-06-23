import { MarketDataError } from "./types";

const allowedTradingApiPaths = [
  /^\/v2\/assets$/,
  /^\/v2\/assets\/[^/]+$/,
  /^\/v2\/clock$/,
  /^\/v2\/options\/contracts$/,
  /^\/v2\/options\/contracts\/[^/]+$/,
];

const allowedDataApiPaths = [
  /^\/v2\/stocks\/snapshots$/,
  /^\/v2\/stocks\/[^/]+\/bars$/,
  /^\/v1beta1\/options\/snapshots$/,
  /^\/v1beta1\/options\/snapshots\/[^/]+$/,
];

const forbiddenPathParts = [
  "/v2/account",
  "/v2/orders",
  "/v2/positions",
  "/v2/transfers",
  "/v2/funding",
  "/v2/funding_wallets",
  "/v2/watchlists",
  "/v2/portfolio",
];

export function assertAlpacaReadOnlyEndpoint(url: string) {
  const parsed = new URL(url);
  const path = parsed.pathname;

  if (forbiddenPathParts.some((forbidden) => path.startsWith(forbidden))) {
    throw new MarketDataError(
      `Blocked Alpaca URL ${path}; it is not an allowed read-only market-data endpoint.`,
      500,
      "ALPACA_FORBIDDEN_ENDPOINT",
    );
  }

  const isAllowedDataApi =
    parsed.origin === "https://data.alpaca.markets" && allowedDataApiPaths.some((pattern) => pattern.test(path));
  const isAllowedTradingMetadataApi =
    parsed.origin === "https://paper-api.alpaca.markets" && allowedTradingApiPaths.some((pattern) => pattern.test(path));

  if (!isAllowedDataApi && !isAllowedTradingMetadataApi) {
    throw new MarketDataError(
      `Blocked Alpaca URL ${path}; it is not an allowed read-only market-data endpoint.`,
      500,
      "ALPACA_FORBIDDEN_ENDPOINT",
    );
  }
}

export function getAlpacaStockFeedLabel(feed: string) {
  return feed === "iex" ? "IEX real-time" : `${feed.toUpperCase()} market data`;
}

export function getAlpacaOptionFeedLabel(feed: string) {
  return feed === "indicative" ? "Indicative options feed" : "OPRA options feed";
}
