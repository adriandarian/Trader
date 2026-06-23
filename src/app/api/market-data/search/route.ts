import { NextResponse } from "next/server";

import { getMarketDataProvider } from "@/lib/market-data/provider";
import { MarketDataError } from "@/lib/market-data/types";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await getMarketDataProvider().searchSymbols(query);
    return NextResponse.json({ results });
  } catch (error) {
    if (error instanceof MarketDataError) {
      return NextResponse.json({ error: error.message, code: error.code, results: [] }, { status: error.status });
    }

    return NextResponse.json({ error: "Symbol search failed.", code: "MARKET_DATA_ERROR", results: [] }, { status: 502 });
  }
}
