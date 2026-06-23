import { DataStatusBadge, TerminalPanel } from "../terminal-ui";

export function SettingsPage({ fixture }: { fixture: boolean }) {
  return (
    <div className="mx-auto min-h-full max-w-[1180px]" data-testid="route-content">
      <h1 className="mb-2 text-[22px] font-semibold tracking-[-0.02em] text-white">Settings</h1>
      <div className="grid grid-cols-2 gap-[10px]">
        <TerminalPanel title="Account Profile">
          <SettingsRows
            rows={[
              ["Account", fixture ? "Proof Portfolio Fixture" : "Sign in required"],
              ["Mode", "Paper trading only"],
              ["Currency", "USD"],
            ]}
          />
        </TerminalPanel>
        <TerminalPanel title="Simulation Settings">
          <SettingsRows
            rows={[
              ["Execution model", "Disabled until auth/database integration"],
              ["Options multiplier", "100x for listed options"],
              ["Risk checks", "Journal inputs required before review"],
            ]}
          />
        </TerminalPanel>
        <TerminalPanel title="Market-Data Connection Health">
          <div className="space-y-3 p-3 text-[12px]">
            <DataStatusBadge label={fixture ? "Fixture preview" : "Uses server-side Alpaca provider"} tone={fixture ? "warning" : "neutral"} />
            <p className="leading-5 text-[#c2ccd8]">API keys remain server-side. The browser calls local route handlers that use the existing provider abstraction.</p>
          </div>
        </TerminalPanel>
        <TerminalPanel title="Alpaca Provider Status">
          <SettingsRows rows={[["Provider", "Alpaca"], ["Trading", "Read-only market data endpoints"], ["Live orders", "Not integrated"]]} />
        </TerminalPanel>
        <TerminalPanel title="Supabase Authentication / Database Health">
          <SettingsRows rows={[["Authentication", "Required before persisted user data"], ["Database", "Required for portfolio source of truth"], ["localStorage", "Not used as portfolio source of truth"]]} />
        </TerminalPanel>
        <TerminalPanel title="Data Freshness / Cache">
          <SettingsRows rows={[["Quote freshness", "Shown per provider timestamp"], ["Portfolio snapshots", "Required for performance analytics"], ["Fixture data", "Screenshot-only and visibly watermarked"]]} />
        </TerminalPanel>
      </div>
    </div>
  );
}

function SettingsRows({ rows }: { rows: string[][] }) {
  return (
    <div className="space-y-2 p-3 text-[12px]">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between rounded-[4px] border border-[#67809626] bg-[#0a1017] px-3 py-2">
          <span className="text-[#9aa7b7]">{label}</span>
          <span className="max-w-[60%] text-right text-white">{value}</span>
        </div>
      ))}
    </div>
  );
}
