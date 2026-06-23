import { NextResponse } from "next/server";

import { getMarketDataProvider } from "@/lib/market-data/provider";
import { MarketDataError } from "@/lib/market-data/types";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const symbol = searchParams.get("symbol")?.trim().toUpperCase();
  const range = searchParams.get("range")?.trim().toUpperCase() ?? "1M";

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required." }, { status: 400 });
  }

  try {
    const bars = await getMarketDataProvider().getDailyBars(symbol, range);
    return NextResponse.json({
      bars,
      source: {
        provider: "alpaca",
        label: process.env.ALPACA_STOCK_FEED === "sip" ? "SIP market data" : "IEX real-time",
        feed: process.env.ALPACA_STOCK_FEED ?? "iex",
        asOf: bars.at(-1)?.date ?? null,
      },
    });
  } catch (error) {
    if (error instanceof MarketDataError) {
      return NextResponse.json({ error: error.message, code: error.code, bars: [] }, { status: error.status });
    }

    return NextResponse.json({ error: "Historical bars request failed.", code: "MARKET_DATA_ERROR", bars: [] }, { status: 502 });
  }
}
