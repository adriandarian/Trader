import { fixtureCashLedger } from "../design-fixtures";
import { currency, signedCurrency } from "../format";
import { ChartFrame, EmptyState, MiniBars, TableShell, TerminalPanel } from "../terminal-ui";

export function CashPage({ fixture }: { fixture: boolean }) {
  const entries = fixture ? fixtureCashLedger : [];
  const balance = entries.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="mx-auto min-h-full max-w-[1180px]" data-testid="route-content">
      <h1 className="mb-2 text-[22px] font-semibold tracking-[-0.02em] text-white">Deposits & Cash</h1>
      <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-[10px]">
        <div className="space-y-[10px]">
          <TerminalPanel title="Cash Ledger">
            {entries.length ? (
              <TableShell
                columns={["Date", "Type", "Source", "Amount", "Note", "Linked Trade"]}
                rows={entries.map((entry) => (
                  <tr key={entry.id} className="h-11 border-b border-[#67809622] text-[#d7e0eb]">
                    <td className="px-3 font-mono">{entry.effectiveAt.slice(0, 10)}</td>
                    <td className="px-3 capitalize">{entry.type.replace("_", " ")}</td>
                    <td className="px-3">{entry.sourceLabel}</td>
                    <td className={`px-3 font-mono ${entry.amount >= 0 ? "text-[#91d66f]" : "text-[#ff666b]"}`}>{signedCurrency(entry.amount)}</td>
                    <td className="px-3">{entry.note ?? "-"}</td>
                    <td className="px-3 font-mono">{entry.linkedTradeId ?? "-"}</td>
                  </tr>
                ))}
              />
            ) : (
              <EmptyState
                title="No ledger entries"
                body="Deposits, withdrawals, trade debits, credits, dividends, fees, and adjustments will be recorded separately from investment returns after sign-in."
              />
            )}
          </TerminalPanel>

          <TerminalPanel title="Monthly Contributions">
            <ChartFrame height="h-[290px]">
              {fixture ? <MiniBars values={[10000, 1200, 0, 0, 0, 800]} /> : null}
            </ChartFrame>
          </TerminalPanel>
        </div>

        <div className="space-y-[10px]">
          <TerminalPanel title="Running Balance">
            <div className="p-3">
              <p className="font-mono text-[28px] font-semibold text-white">{currency(balance)}</p>
              <p className="mt-2 text-[12px] leading-5 text-[#9aa7b7]">Cash movement is ledger activity, not investment performance. Returns are calculated separately.</p>
            </div>
          </TerminalPanel>
          <TerminalPanel title="Cash Actions">
            <div className="space-y-3 p-3 text-[12px]">
              <button className="h-10 w-full rounded-[4px] bg-[#2e67b7] font-semibold text-white" type="button">
                Sign in to deposit
              </button>
              <button className="h-10 w-full rounded-[4px] border border-[#67809640] text-[#d7e0eb]" type="button">
                Sign in to withdraw
              </button>
              <p className="leading-5 text-[#9aa7b7]">Authentication is required before cash-ledger changes can be associated with an account.</p>
            </div>
          </TerminalPanel>
        </div>
      </div>
    </div>
  );
}
