import { NextResponse } from "next/server";

import { getMarketDataProvider } from "@/lib/market-data/provider";
import { MarketDataError } from "@/lib/market-data/types";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const underlying = searchParams.get("underlying")?.trim().toUpperCase();

  if (!underlying) {
    return NextResponse.json({ error: "Underlying symbol is required.", contracts: [] }, { status: 400 });
  }

  try {
    const contracts = await getMarketDataProvider().getOptionContracts(underlying, {
      expirationDateGte: searchParams.get("expirationDateGte") ?? undefined,
      expirationDateLte: searchParams.get("expirationDateLte") ?? undefined,
      strikeGte: numberParam(searchParams.get("strikeGte")),
      strikeLte: numberParam(searchParams.get("strikeLte")),
      type: optionTypeParam(searchParams.get("type")),
    });

    return NextResponse.json({
      contracts,
      source: {
        provider: "alpaca",
        label: "Alpaca option contracts",
        asOf: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof MarketDataError) {
      return NextResponse.json({ error: error.message, code: error.code, contracts: [] }, { status: error.status });
    }

    return NextResponse.json({ error: "Option contract lookup failed.", code: "MARKET_DATA_ERROR", contracts: [] }, { status: 502 });
  }
}

function numberParam(value: string | null) {
  if (!value) {
    return undefined;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function optionTypeParam(value: string | null) {
  return value === "call" || value === "put" ? value : undefined;
}
