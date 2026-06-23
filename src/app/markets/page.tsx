import { AppShell } from "@/components/trading/app-shell";
import { isDesignFixture } from "@/components/trading/design-fixtures";
import { MarketsWorkspace } from "@/components/trading/pages/markets-workspace";
import { getShellSummary } from "@/components/trading/shell-summary";

type RouteProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: RouteProps) {
  const params = searchParams ? await searchParams : {};
  const fixture = isDesignFixture(params.__fixture);
  const symbol = typeof params.symbol === "string" ? params.symbol : undefined;
  const shellSummary = getShellSummary(fixture);

  return (
    <AppShell cashAvailable={shellSummary.cashAvailable} fixture={fixture} totalPortfolioValue={shellSummary.totalPortfolioValue}>
      <MarketsWorkspace fixture={fixture} initialSymbol={symbol} />
    </AppShell>
  );
}
