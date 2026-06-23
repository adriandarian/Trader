import { NextResponse } from "next/server";

import { getMarketDataProvider } from "@/lib/market-data/provider";
import { MarketDataError } from "@/lib/market-data/types";

export async function GET(request: Request) {
  const optionSymbol = new URL(request.url).searchParams.get("symbol")?.trim().toUpperCase();

  if (!optionSymbol) {
    return NextResponse.json({ error: "Option symbol is required." }, { status: 400 });
  }

  try {
    const snapshot = await getMarketDataProvider().getOptionSnapshot(optionSymbol);
    return NextResponse.json({ snapshot });
  } catch (error) {
    if (error instanceof MarketDataError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    return NextResponse.json({ error: "Option snapshot request failed.", code: "MARKET_DATA_ERROR" }, { status: 502 });
  }
}
