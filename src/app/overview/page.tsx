import { AppShell } from "@/components/trading/app-shell";
import { isDesignFixture } from "@/components/trading/design-fixtures";
import { OverviewPage } from "@/components/trading/pages/overview-page";
import { OverviewRightRail } from "@/components/trading/right-rail";
import { getShellSummary } from "@/components/trading/shell-summary";

type RouteProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: RouteProps) {
  const params = searchParams ? await searchParams : {};
  const fixture = isDesignFixture(params.__fixture);
  const shellSummary = getShellSummary(fixture);

  return (
    <AppShell
      cashAvailable={shellSummary.cashAvailable}
      fixture={fixture}
      rightRail={<OverviewRightRail fixture={fixture} />}
      totalPortfolioValue={shellSummary.totalPortfolioValue}
    >
      <OverviewPage fixture={fixture} />
    </AppShell>
  );
}
