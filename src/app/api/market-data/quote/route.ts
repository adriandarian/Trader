import { NextResponse } from "next/server";

import { getMarketDataProvider } from "@/lib/market-data/provider";
import { MarketDataError } from "@/lib/market-data/types";

export async function GET(request: Request) {
  const symbol = new URL(request.url).searchParams.get("symbol")?.trim().toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required." }, { status: 400 });
  }

  try {
    const [quote, clock] = await Promise.all([
      getMarketDataProvider().getQuote(symbol),
      getMarketDataProvider().getMarketClock().catch(() => null),
    ]);

    return NextResponse.json({ quote, clock });
  } catch (error) {
    return marketDataErrorResponse(error);
  }
}

function marketDataErrorResponse(error: unknown) {
  if (error instanceof MarketDataError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }

  return NextResponse.json({ error: "Market data request failed.", code: "MARKET_DATA_ERROR" }, { status: 502 });
}
