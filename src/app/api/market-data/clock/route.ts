import { NextResponse } from "next/server";

import { getMarketDataProvider } from "@/lib/market-data/provider";
import { MarketDataError } from "@/lib/market-data/types";

export async function GET() {
  try {
    const clock = await getMarketDataProvider().getMarketClock();
    return NextResponse.json({ clock });
  } catch (error) {
    if (error instanceof MarketDataError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    return NextResponse.json({ error: "Market clock request failed.", code: "MARKET_DATA_ERROR" }, { status: 502 });
  }
}
