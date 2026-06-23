import { ChartFrame, EmptyState, MiniBars, TerminalPanel } from "../terminal-ui";

export function PerformancePage({ fixture }: { fixture: boolean }) {
  return (
    <div className="mx-auto min-h-full max-w-[1180px]" data-testid="route-content">
      <h1 className="mb-2 text-[22px] font-semibold tracking-[-0.02em] text-white">Performance</h1>
      <div className="grid grid-cols-2 gap-[10px]">
        <TerminalPanel title="Equity Curve">
          <ChartFrame>{fixture ? <MiniBars values={[20, 24, 31, 36, 44, 53, 61]} /> : <SpecificEmpty />}</ChartFrame>
        </TerminalPanel>
        <TerminalPanel title="Contribution-Adjusted Return">
          <ChartFrame>{fixture ? <MiniBars values={[0, 1.2, 2.8, 3.5, 5.1, 7.2]} /> : <SpecificEmpty />}</ChartFrame>
        </TerminalPanel>
        <TerminalPanel title="Time-Weighted Return">
          <ChartFrame>{fixture ? <MiniBars values={[0.4, 0.9, -0.3, 1.4, 2.1, 2.6]} /> : <SpecificEmpty />}</ChartFrame>
        </TerminalPanel>
        <TerminalPanel title="SPY Comparison">
          <ChartFrame>{fixture ? <MiniBars values={[0.2, 0.5, 1.1, 1.4, 3.2, 4.8]} /> : <SpecificEmpty />}</ChartFrame>
        </TerminalPanel>
        <TerminalPanel title="Monthly Return Calendar">
          <div className="grid grid-cols-6 gap-2 p-3 text-[12px]">
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, index) => (
              <div key={month} className="rounded-[4px] border border-[#67809626] bg-[#0a1017] p-3">
                <p className="text-[#9aa7b7]">{month}</p>
                <p className={`mt-2 font-mono ${fixture && index !== 2 ? "text-[#91d66f]" : "text-[#ff666b]"}`}>{fixture ? (index === 2 ? "-0.6%" : "+1.4%") : "-"}</p>
              </div>
            ))}
          </div>
        </TerminalPanel>
        <TerminalPanel title="Drawdown Chart">
          <ChartFrame>{fixture ? <MiniBars values={[-0.4, -1.1, -2.2, -0.8, -0.3, -1.4]} /> : <SpecificEmpty />}</ChartFrame>
        </TerminalPanel>
        <TerminalPanel title="Strategy Breakdown">
          <div className="space-y-2 p-3 text-[12px]">
            {["Momentum", "Swing", "Options premium"].map((strategy) => (
              <div key={strategy} className="flex items-center justify-between rounded-[4px] border border-[#67809626] bg-[#0a1017] p-3">
                <span className="text-white">{strategy}</span>
                <span className="font-mono text-[#91d66f]">{fixture ? "+3.2R" : "-"}</span>
              </div>
            ))}
          </div>
        </TerminalPanel>
        <TerminalPanel title="Win/Loss Statistics">
          <div className="grid grid-cols-3 gap-3 p-3 text-[12px]">
            <Stat label="Win rate" value={fixture ? "66.67%" : "-"} />
            <Stat label="Avg win" value={fixture ? "$397.16" : "-"} />
            <Stat label="Avg loss" value={fixture ? "$85.00" : "-"} />
          </div>
        </TerminalPanel>
      </div>
    </div>
  );
}

function SpecificEmpty() {
  return <EmptyState title="Trades and snapshots required" body="This analytic requires recorded trades and portfolio snapshots. Fixture screenshots show layout only." />;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[4px] border border-[#67809626] bg-[#0a1017] p-3">
      <p className="text-[#9aa7b7]">{label}</p>
      <p className="mt-2 font-mono text-white">{value}</p>
    </div>
  );
}
