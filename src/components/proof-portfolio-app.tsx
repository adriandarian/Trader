"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, BookOpen, Landmark, LineChart, Plus, ShieldCheck, Wallet } from "lucide-react";

import {
  auditEvent,
  calculatePortfolio,
  currency,
  getTradePnL,
  ledgerEntryForClosedTrade,
  ledgerEntryForTrade,
  percent,
} from "@/domain/accounting";
import { initialState } from "@/domain/seed";
import type { AssetType, LedgerEntry, ProofPortfolioState, Trade } from "@/domain/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const storageKey = "proof-portfolio-state-v1";

type TradeForm = {
  ticker: string;
  assetType: AssetType;
  action: "buy" | "sell";
  quantity: string;
  entryPrice: string;
  openedAt: string;
  thesis: string;
  strategy: string;
  riskAmount: string;
  target: string;
  stopLoss: string;
  notes: string;
  underlyingTicker: string;
  optionType: "call" | "put";
  strike: string;
  expirationDate: string;
  premium: string;
  contracts: string;
  strategyTag: string;
  maxLoss: string;
  maxProfit: string;
};

const emptyTradeForm: TradeForm = {
  ticker: "AAPL",
  assetType: "stock" as AssetType,
  action: "buy" as const,
  quantity: "1",
  entryPrice: "100",
  openedAt: new Date().toISOString().slice(0, 10),
  thesis: "",
  strategy: "",
  riskAmount: "50",
  target: "120",
  stopLoss: "95",
  notes: "",
  underlyingTicker: "",
  optionType: "call" as const,
  strike: "",
  expirationDate: "",
  premium: "",
  contracts: "",
  strategyTag: "",
  maxLoss: "",
  maxProfit: "",
};

export function ProofPortfolioApp() {
  const [state, setState] = useState<ProofPortfolioState>(() => {
    if (typeof window === "undefined") {
      return initialState;
    }

    const stored = window.localStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as ProofPortfolioState) : initialState;
  });
  const [depositForm, setDepositForm] = useState({
    amount: "1250",
    date: new Date().toISOString().slice(0, 10),
    source: "Paycheck",
    notes: "",
  });
  const [tradeForm, setTradeForm] = useState(emptyTradeForm);
  const [closePrices, setClosePrices] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("overview");
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setChartsReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const portfolio = useMemo(() => calculatePortfolio(state), [state]);

  function addDeposit() {
    const amount = Number(depositForm.amount);

    if (!amount || amount <= 0) {
      return;
    }

    const entry: LedgerEntry = {
      id: crypto.randomUUID(),
      date: depositForm.date,
      type: "deposit",
      amount,
      source: depositForm.source || "Deposit",
      notes: depositForm.notes,
    };

    setState((current) => ({
      ...current,
      ledger: [entry, ...current.ledger],
      auditLog: [
        auditEvent("ledger", entry.id, "ledger_posted", `Posted deposit of ${currency(amount)} from ${entry.source}.`),
        ...current.auditLog,
      ],
    }));
  }

  function addTrade() {
    const trade: Trade = {
      id: crypto.randomUUID(),
      ticker: tradeForm.ticker.toUpperCase(),
      assetType: tradeForm.assetType,
      action: tradeForm.action,
      quantity: Number(tradeForm.quantity),
      entryPrice: Number(tradeForm.entryPrice),
      openedAt: tradeForm.openedAt,
      thesis: tradeForm.thesis || "No thesis recorded.",
      strategy: tradeForm.strategy || "Manual trade",
      riskAmount: Number(tradeForm.riskAmount),
      target: Number(tradeForm.target),
      stopLoss: Number(tradeForm.stopLoss),
      notes: tradeForm.notes,
      status: "open",
      underlyingTicker: tradeForm.assetType === "option" ? tradeForm.underlyingTicker.toUpperCase() : undefined,
      optionType: tradeForm.assetType === "option" ? tradeForm.optionType : undefined,
      strike: numberOrUndefined(tradeForm.strike),
      expirationDate: tradeForm.assetType === "option" ? tradeForm.expirationDate : undefined,
      premium: numberOrUndefined(tradeForm.premium),
      contracts: numberOrUndefined(tradeForm.contracts),
      strategyTag: tradeForm.strategyTag || undefined,
      maxLoss: numberOrUndefined(tradeForm.maxLoss),
      maxProfit: numberOrUndefined(tradeForm.maxProfit),
      greeks: tradeForm.assetType === "option" ? {} : undefined,
    };

    if (!trade.ticker || !trade.quantity || !trade.entryPrice) {
      return;
    }

    const ledgerEntry = ledgerEntryForTrade(trade);

    setState((current) => ({
      ...current,
      trades: [trade, ...current.trades],
      ledger: [ledgerEntry, ...current.ledger],
      auditLog: [
        auditEvent("trade", trade.id, "created", `Opened ${trade.action} ${trade.quantity} ${trade.ticker} at ${currency(trade.entryPrice)}.`),
        auditEvent("ledger", ledgerEntry.id, "ledger_posted", `Posted ${ledgerEntry.source} cash ledger movement.`),
        ...current.auditLog,
      ],
    }));
    setTradeForm(emptyTradeForm);
  }

  function closeTrade(trade: Trade) {
    const exitPrice = Number(closePrices[trade.id]);

    if (!exitPrice || trade.status === "closed") {
      return;
    }

    const closedTrade: Trade = {
      ...trade,
      exitPrice,
      closedAt: new Date().toISOString().slice(0, 10),
      status: "closed",
    };
    const closeLedgerEntry = ledgerEntryForClosedTrade(closedTrade);

    setState((current) => ({
      ...current,
      trades: current.trades.map((item) => (item.id === trade.id ? closedTrade : item)),
      ledger: closeLedgerEntry ? [closeLedgerEntry, ...current.ledger] : current.ledger,
      auditLog: [
        auditEvent(
          "trade",
          trade.id,
          "closed",
          `Closed ${trade.ticker} at ${currency(exitPrice)} for realized P/L ${currency(getTradePnL(closedTrade))}.`,
        ),
        ...current.auditLog,
      ],
    }));
  }

  function resetDemo() {
    setState(initialState);
    window.localStorage.removeItem(storageKey);
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LineChart />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paper brokerage ledger</p>
                <h1 className="text-3xl font-semibold tracking-tight">Proof Portfolio</h1>
              </div>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Track fake deposits, manual stock and option trades, cash movements, realized results, and deposit-adjusted performance using a swappable market data service.
            </p>
          </div>
          <Button variant="outline" onClick={resetDemo}>
            Reset demo data
          </Button>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Cash balance" value={currency(portfolio.cashBalance)} icon={<Wallet />} />
          <MetricCard title="Portfolio value" value={currency(portfolio.totalPortfolioValue)} icon={<Landmark />} />
          <MetricCard
            title="Trading return"
            value={currency(portfolio.tradingReturnExcludingDeposits)}
            description="Excludes net deposits and withdrawals"
            icon={<Activity />}
          />
          <MetricCard
            title="Account growth"
            value={percent(portfolio.accountGrowthIncludingDeposits)}
            description="Return on contributed paper capital"
            icon={<ShieldCheck />}
          />
        </section>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(String(value))} className="gap-5">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ledger">Cash ledger</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="ticket">Trade ticket</TabsTrigger>
            <TabsTrigger value="journal">Trade journal</TabsTrigger>
            <TabsTrigger value="report">Performance report</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex flex-col gap-5">
            <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Equity curve</CardTitle>
                  <CardDescription>Portfolio value versus cumulative deposits.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 overflow-x-auto">
                    {chartsReady && activeTab === "overview" ? (
                      <AreaChart width={900} height={300} data={portfolio.equityCurve}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                        <Tooltip formatter={(value) => currency(Number(value))} />
                        <Area dataKey="totalDeposits" name="Deposits" stroke="var(--chart-2)" fill="var(--chart-1)" />
                        <Area dataKey="totalValue" name="Total value" stroke="var(--foreground)" fill="var(--chart-2)" />
                      </AreaChart>
                    ) : (
                      <ChartFallback />
                    )}
                  </div>
                </CardContent>
              </Card>
              <DepositCard form={depositForm} setForm={setDepositForm} onAdd={addDeposit} />
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <StatPanel label="Realized P/L" value={currency(portfolio.realizedPnL)} />
              <StatPanel label="Unrealized P/L" value={currency(portfolio.unrealizedPnL)} />
              <StatPanel label="Total deposits" value={currency(portfolio.totalDeposits)} />
            </div>
          </TabsContent>

          <TabsContent value="ledger">
            <Card>
              <CardHeader>
                <CardTitle>Cash ledger</CardTitle>
                <CardDescription>Every deposit, withdrawal, trade debit, trade credit, option premium, and fee placeholder posts here.</CardDescription>
              </CardHeader>
              <CardContent>
                <LedgerTable entries={state.ledger} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio">
            <Card>
              <CardHeader>
                <CardTitle>Open positions</CardTitle>
                <CardDescription>Mock quotes are supplied by the market data abstraction in <code>src/domain/market-data.ts</code>.</CardDescription>
              </CardHeader>
              <CardContent>
                <PositionsTable positions={portfolio.openPositions} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ticket">
            <TradeTicket form={tradeForm} setForm={setTradeForm} onAdd={addTrade} />
          </TabsContent>

          <TabsContent value="journal" className="flex flex-col gap-5">
            <Card>
              <CardHeader>
                <CardTitle>Trade journal</CardTitle>
                <CardDescription>Closed trades are not editable in the MVP. Closing creates an audit event and cash ledger posting.</CardDescription>
              </CardHeader>
              <CardContent>
                <TradeJournal trades={state.trades} closePrices={closePrices} setClosePrices={setClosePrices} closeTrade={closeTrade} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audit log</CardTitle>
                <CardDescription>Append-only proof trail for posted cash movements and closed trades.</CardDescription>
              </CardHeader>
              <CardContent>
                <AuditLog state={state} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report" className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Monthly performance</CardTitle>
                <CardDescription>Trading return stays separated from deposit-driven account growth.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 overflow-x-auto">
                  {chartsReady && activeTab === "report" ? (
                    <BarChart width={760} height={300} data={portfolio.monthlyPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => (name === "accountGrowth" ? percent(Number(value)) : currency(Number(value)))} />
                      <Bar dataKey="tradingReturn" name="Trading return" fill="var(--foreground)" />
                      <Bar dataKey="accountGrowth" name="Account growth %" fill="var(--chart-2)" />
                    </BarChart>
                  ) : (
                    <ChartFallback />
                  )}
                  </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Proof metrics</CardTitle>
                <CardDescription>Calculated from closed trades and the equity curve.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <StatPanel label="Win rate" value={percent(portfolio.winRate)} />
                <StatPanel label="Average win" value={currency(portfolio.averageWin)} />
                <StatPanel label="Average loss" value={currency(portfolio.averageLoss)} />
                <StatPanel label="Max drawdown" value={percent(-portfolio.maxDrawdown)} />
                <Separator />
                <StatPanel label="Best trade" value={portfolio.bestTrade ? `${portfolio.bestTrade.ticker} ${currency(getTradePnL(portfolio.bestTrade))}` : "None"} />
                <StatPanel label="Worst trade" value={portfolio.worstTrade ? `${portfolio.worstTrade.ticker} ${currency(getTradePnL(portfolio.worstTrade))}` : "None"} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction className="text-muted-foreground">{icon}</CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </CardContent>
    </Card>
  );
}

function DepositCard({
  form,
  setForm,
  onAdd,
}: {
  form: { amount: string; date: string; source: string; notes: string };
  setForm: React.Dispatch<React.SetStateAction<{ amount: string; date: string; source: string; notes: string }>>;
  onAdd: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add fake deposit</CardTitle>
        <CardDescription>Deposits increase cash but never count as trading profit.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="deposit-amount">Amount</FieldLabel>
            <Input id="deposit-amount" type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} />
          </Field>
          <Field>
            <FieldLabel htmlFor="deposit-date">Date</FieldLabel>
            <Input id="deposit-date" type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
          </Field>
          <Field>
            <FieldLabel htmlFor="deposit-source">Source label</FieldLabel>
            <Input id="deposit-source" value={form.source} onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))} />
          </Field>
          <Field>
            <FieldLabel htmlFor="deposit-notes">Notes</FieldLabel>
            <Textarea id="deposit-notes" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          </Field>
          <Button onClick={onAdd}>
            <Plus data-icon="inline-start" />
            Post deposit
          </Button>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

function TradeTicket({
  form,
  setForm,
  onAdd,
}: {
  form: TradeForm;
  setForm: React.Dispatch<React.SetStateAction<TradeForm>>;
  onAdd: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade ticket</CardTitle>
        <CardDescription>Manual stock trades are active in the MVP; option fields are modeled for the next execution layer.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup className="grid gap-5 lg:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="ticker">Ticker</FieldLabel>
            <Input id="ticker" value={form.ticker} onChange={(event) => setForm((current) => ({ ...current, ticker: event.target.value }))} />
          </Field>
          <Field>
            <FieldLabel htmlFor="asset-type">Asset type</FieldLabel>
            <select id="asset-type" className="h-9 rounded-lg border border-input bg-background px-3 text-sm" value={form.assetType} onChange={(event) => setForm((current) => ({ ...current, assetType: event.target.value as AssetType }))}>
              <option value="stock">Stock</option>
              <option value="option">Option</option>
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="action">Action</FieldLabel>
            <select id="action" className="h-9 rounded-lg border border-input bg-background px-3 text-sm" value={form.action} onChange={(event) => setForm((current) => ({ ...current, action: event.target.value as "buy" | "sell" }))}>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="quantity">Quantity</FieldLabel>
            <Input id="quantity" type="number" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} />
          </Field>
          <Field>
            <FieldLabel htmlFor="entry-price">Entry price</FieldLabel>
            <Input id="entry-price" type="number" value={form.entryPrice} onChange={(event) => setForm((current) => ({ ...current, entryPrice: event.target.value }))} />
          </Field>
          <Field>
            <FieldLabel htmlFor="opened-at">Date</FieldLabel>
            <Input id="opened-at" type="date" value={form.openedAt} onChange={(event) => setForm((current) => ({ ...current, openedAt: event.target.value }))} />
          </Field>
          <Field>
            <FieldLabel htmlFor="risk">Risk amount</FieldLabel>
            <Input id="risk" type="number" value={form.riskAmount} onChange={(event) => setForm((current) => ({ ...current, riskAmount: event.target.value }))} />
          </Field>
          <Field>
            <FieldLabel htmlFor="target">Target</FieldLabel>
            <Input id="target" type="number" value={form.target} onChange={(event) => setForm((current) => ({ ...current, target: event.target.value }))} />
          </Field>
          <Field>
            <FieldLabel htmlFor="stop-loss">Stop loss</FieldLabel>
            <Input id="stop-loss" type="number" value={form.stopLoss} onChange={(event) => setForm((current) => ({ ...current, stopLoss: event.target.value }))} />
          </Field>
          <Field className="lg:col-span-3">
            <FieldLabel htmlFor="thesis">Thesis</FieldLabel>
            <Textarea id="thesis" value={form.thesis} onChange={(event) => setForm((current) => ({ ...current, thesis: event.target.value }))} />
          </Field>
          <Field className="lg:col-span-2">
            <FieldLabel htmlFor="strategy">Strategy</FieldLabel>
            <Input id="strategy" value={form.strategy} onChange={(event) => setForm((current) => ({ ...current, strategy: event.target.value }))} />
          </Field>
          <Field>
            <FieldLabel htmlFor="notes">Notes</FieldLabel>
            <Input id="notes" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          </Field>
          {form.assetType === "option" ? <OptionFields form={form} setForm={setForm} /> : null}
          <Field className="lg:col-span-3">
            <FieldDescription>Posting a ticket immediately writes a matching cash ledger debit or credit. Fees are represented in the schema and ledger type set for future brokerage simulation.</FieldDescription>
            <Button onClick={onAdd}>Post trade</Button>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

function OptionFields({ form, setForm }: { form: TradeForm; setForm: React.Dispatch<React.SetStateAction<TradeForm>> }) {
  return (
    <>
      <Field>
        <FieldLabel htmlFor="underlying">Underlying ticker</FieldLabel>
        <Input id="underlying" value={form.underlyingTicker} onChange={(event) => setForm((current) => ({ ...current, underlyingTicker: event.target.value }))} />
      </Field>
      <Field>
        <FieldLabel htmlFor="option-type">Call/put</FieldLabel>
        <select id="option-type" className="h-9 rounded-lg border border-input bg-background px-3 text-sm" value={form.optionType} onChange={(event) => setForm((current) => ({ ...current, optionType: event.target.value as "call" | "put" }))}>
          <option value="call">Call</option>
          <option value="put">Put</option>
        </select>
      </Field>
      <Field>
        <FieldLabel htmlFor="strike">Strike</FieldLabel>
        <Input id="strike" type="number" value={form.strike} onChange={(event) => setForm((current) => ({ ...current, strike: event.target.value }))} />
      </Field>
      <Field>
        <FieldLabel htmlFor="expiration">Expiration</FieldLabel>
        <Input id="expiration" type="date" value={form.expirationDate} onChange={(event) => setForm((current) => ({ ...current, expirationDate: event.target.value }))} />
      </Field>
      <Field>
        <FieldLabel htmlFor="premium">Premium</FieldLabel>
        <Input id="premium" type="number" value={form.premium} onChange={(event) => setForm((current) => ({ ...current, premium: event.target.value }))} />
      </Field>
      <Field>
        <FieldLabel htmlFor="contracts">Contracts</FieldLabel>
        <Input id="contracts" type="number" value={form.contracts} onChange={(event) => setForm((current) => ({ ...current, contracts: event.target.value }))} />
      </Field>
      <Field>
        <FieldLabel htmlFor="strategy-tag">Strategy tag</FieldLabel>
        <Input id="strategy-tag" value={form.strategyTag} onChange={(event) => setForm((current) => ({ ...current, strategyTag: event.target.value }))} />
      </Field>
      <Field>
        <FieldLabel htmlFor="max-loss">Max loss</FieldLabel>
        <Input id="max-loss" type="number" value={form.maxLoss} onChange={(event) => setForm((current) => ({ ...current, maxLoss: event.target.value }))} />
      </Field>
      <Field>
        <FieldLabel htmlFor="max-profit">Max profit placeholder</FieldLabel>
        <Input id="max-profit" type="number" value={form.maxProfit} onChange={(event) => setForm((current) => ({ ...current, maxProfit: event.target.value }))} />
      </Field>
    </>
  );
}

function LedgerTable({ entries }: { entries: LedgerEntry[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Source</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Notes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.toSorted((a, b) => b.date.localeCompare(a.date)).map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>{entry.date}</TableCell>
            <TableCell><Badge variant="secondary">{entry.type}</Badge></TableCell>
            <TableCell>{entry.source}</TableCell>
            <TableCell className="text-right font-medium">{currency(entry.amount)}</TableCell>
            <TableCell className="text-muted-foreground">{entry.notes || "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PositionsTable({ positions }: { positions: ReturnType<typeof calculatePortfolio>["openPositions"] }) {
  if (!positions.length) {
    return <p className="text-sm text-muted-foreground">No open positions yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticker</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Avg cost</TableHead>
          <TableHead className="text-right">Mock price</TableHead>
          <TableHead className="text-right">Market value</TableHead>
          <TableHead className="text-right">Unrealized P/L</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {positions.map((position) => (
          <TableRow key={`${position.assetType}-${position.ticker}`}>
            <TableCell className="font-medium">{position.ticker}</TableCell>
            <TableCell>{position.assetType}</TableCell>
            <TableCell className="text-right">{position.quantity}</TableCell>
            <TableCell className="text-right">{currency(position.averageCost)}</TableCell>
            <TableCell className="text-right">{currency(position.marketPrice)}</TableCell>
            <TableCell className="text-right">{currency(position.marketValue)}</TableCell>
            <TableCell className="text-right">{currency(position.unrealizedPnL)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TradeJournal({
  trades,
  closePrices,
  setClosePrices,
  closeTrade,
}: {
  trades: Trade[];
  closePrices: Record<string, string>;
  setClosePrices: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  closeTrade: (trade: Trade) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticker</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Action</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Entry</TableHead>
          <TableHead className="text-right">Exit</TableHead>
          <TableHead>Strategy</TableHead>
          <TableHead>Thesis</TableHead>
          <TableHead>Close</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trades.map((trade) => (
          <TableRow key={trade.id}>
            <TableCell className="font-medium">{trade.ticker}</TableCell>
            <TableCell><Badge variant={trade.status === "open" ? "default" : "secondary"}>{trade.status}</Badge></TableCell>
            <TableCell>{trade.action}</TableCell>
            <TableCell className="text-right">{trade.quantity}</TableCell>
            <TableCell className="text-right">{currency(trade.entryPrice)}</TableCell>
            <TableCell className="text-right">{trade.exitPrice ? currency(trade.exitPrice) : "-"}</TableCell>
            <TableCell>{trade.strategy}</TableCell>
            <TableCell className="max-w-64 text-muted-foreground">{trade.thesis}</TableCell>
            <TableCell>
              {trade.status === "open" ? (
                <div className="flex min-w-44 items-center gap-2">
                  <Input
                    aria-label={`Exit price for ${trade.ticker}`}
                    type="number"
                    placeholder="Exit"
                    value={closePrices[trade.id] ?? ""}
                    onChange={(event) => setClosePrices((current) => ({ ...current, [trade.id]: event.target.value }))}
                  />
                  <Button variant="outline" onClick={() => closeTrade(trade)}>Close</Button>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Locked</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function AuditLog({ state }: { state: ProofPortfolioState }) {
  return (
    <div className="flex flex-col gap-3">
      {state.auditLog.map((event) => (
        <div key={event.id} className="flex items-start gap-3 rounded-lg border p-3">
          <BookOpen className="mt-0.5 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">{event.summary}</p>
            <p className="text-xs text-muted-foreground">{event.date} · {event.entityType} · {event.action}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function numberOrUndefined(value: string) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && value !== "" ? numeric : undefined;
}

function ChartFallback() {
  return <div className="flex h-full items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">Chart loading</div>;
}
