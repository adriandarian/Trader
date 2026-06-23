"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  ChevronLeft,
  Globe2,
  Landmark,
  LayoutGrid,
  Search,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { DESIGN_FIXTURE_WATERMARK } from "./design-fixtures";
import { currency, formatTimestamp } from "./format";

type MarketClock = {
  isOpen: boolean | null;
  timestamp: string;
  nextOpen: string | null;
  nextClose: string | null;
};

type ClockResponse = {
  clock?: MarketClock;
  error?: string;
  code?: string;
};

const navItems = [
  { label: "Overview", href: "/overview", icon: LayoutGrid },
  { label: "Markets", href: "/markets", icon: Globe2 },
  { label: "Portfolio", href: "/portfolio", icon: BriefcaseBusiness },
  { label: "Trade", href: "/trade", icon: ArrowLeftRight },
  { label: "Journal", href: "/journal", icon: BookOpen },
  { label: "Deposits & Cash", href: "/cash", icon: Landmark },
  { label: "Performance", href: "/performance", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

export function AppShell({
  children,
  rightRail,
  fixture = false,
  cashAvailable = 0,
  totalPortfolioValue = 0,
}: {
  children: ReactNode;
  rightRail?: ReactNode;
  fixture?: boolean;
  cashAvailable?: number;
  totalPortfolioValue?: number;
}) {
  return (
    <main className="h-dvh overflow-hidden bg-[#070b10] text-[#e7edf4]" data-fixture-mode={fixture ? "design" : "runtime"}>
      <div className="grid h-dvh grid-rows-[52px_minmax(0,1fr)_40px]">
        <TopHeader fixture={fixture} />
        <div
          className={`grid min-h-0 grid-cols-1 lg:grid-cols-[188px_minmax(0,1fr)] ${
            rightRail ? "xl:grid-cols-[188px_minmax(0,1fr)_360px]" : ""
          }`}
        >
          <LeftSidebar
            cashAvailable={cashAvailable}
            totalPortfolioValue={totalPortfolioValue}
            fixture={fixture}
          />
          <section className="min-h-0 min-w-0 overflow-auto border-r border-[#67809640] px-4 py-3 terminal-scroll">
            {children}
          </section>
          {rightRail ? (
            <aside className="hidden min-h-0 overflow-hidden bg-[#070b10] p-[8px] xl:block">{rightRail}</aside>
          ) : null}
        </div>
        <TerminalFooter />
      </div>
      {fixture ? (
        <div className="pointer-events-none fixed bottom-12 right-4 z-50 rounded-[3px] border border-[#c7973566] bg-[#2b220dcc] px-3 py-1.5 font-mono text-[11px] text-[#dfc27c]">
          {DESIGN_FIXTURE_WATERMARK}
        </div>
      ) : null}
    </main>
  );
}

function TopHeader({ fixture }: { fixture: boolean }) {
  const router = useRouter();
  const [symbolQuery, setSymbolQuery] = useState("");
  const [clockState, setClockState] = useState<ClockResponse>(() =>
    fixture
      ? {
          clock: {
            isOpen: true,
            timestamp: "2026-06-23T16:12:08.000Z",
            nextOpen: null,
            nextClose: "2026-06-23T20:00:00.000Z",
          },
        }
      : {},
  );

  useEffect(() => {
    if (fixture) return;

    const controller = new AbortController();

    async function loadClock() {
      try {
        const response = await fetch("/api/market-data/clock", { signal: controller.signal });
        const payload = (await response.json()) as ClockResponse;

        if (!response.ok) {
          setClockState({ error: payload.error ?? "Market clock request failed.", code: payload.code });
          return;
        }

        setClockState(payload);
      } catch {
        if (!controller.signal.aborted) {
          setClockState({ error: "Unable to reach the market-data route.", code: "NETWORK_ERROR" });
        }
      }
    }

    void loadClock();

    return () => controller.abort();
  }, [fixture]);

  const clock = clockState.clock ?? null;
  const providerConnected = Boolean(clockState.clock);

  function openMarkets() {
    const symbol = symbolQuery.trim().toUpperCase();
    router.push(symbol ? `/markets?symbol=${encodeURIComponent(symbol)}` : "/markets");
  }

  return (
    <header className="grid min-w-0 grid-cols-[188px_minmax(320px,420px)_minmax(0,1fr)] items-center border-b border-[#67809640] bg-[#070b10]">
      <Link className="flex items-center gap-3 px-4" href="/overview">
        <LogoMark />
        <span className="truncate text-[16px] font-semibold tracking-[-0.01em] text-white">Proof Portfolio</span>
      </Link>

      <div className="flex min-w-0 items-center rounded-[4px] border border-[#6780964d] bg-[#0d141d] px-2">
        <Search className="size-4 shrink-0 text-[#8997a8]" />
        <input
          className="h-[34px] min-w-0 flex-1 bg-transparent px-3 text-[12px] text-[#e7edf4] outline-none placeholder:text-[#7a8796]"
          value={symbolQuery}
          placeholder="Search symbols (e.g., AAPL, SPY, TSLA)"
          onChange={(event) => setSymbolQuery(event.target.value.toUpperCase())}
          onKeyDown={(event) => {
            if (event.key === "Enter") openMarkets();
          }}
        />
        <button className="rounded-[3px] bg-[#2e67b7] px-2 py-1 text-[11px] font-semibold text-white" onClick={openMarkets} type="button">
          Open
        </button>
      </div>

      <div className="flex min-w-0 items-center justify-end gap-4 px-4 text-[12px] text-[#c6d0dc]">
        <StatusBlock
          dotTone={clock?.isOpen ? "positive" : clockState.error ? "warning" : "negative"}
          label={marketStatusLabel(clock, clockState.error)}
          detail={marketStatusDetail(clock, clockState.error)}
        />
        <HeaderDivider />
        <StatusBlock
          dotTone={providerConnected ? "positive" : clockState.error ? "warning" : "negative"}
          label="Data: Alpaca"
          detail={providerConnected ? "Connected" : clockState.error ? "Needs configuration" : "Checking"}
        />
        <HeaderDivider />
        <span className="whitespace-nowrap font-mono text-[12px] text-[#c6d0dc]">
          Last updated: {formatTimestamp(clock?.timestamp, "time")}
        </span>
        <HeaderDivider />
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-[#1b2531] font-mono text-[12px] text-white">PP</div>
          <div className="hidden min-w-0 xl:block">
            <p className="truncate text-[12px] font-semibold text-white">Proof Portfolio</p>
            <p className="text-[12px] text-[#c6d0dc]">Individual</p>
          </div>
          <ChevronDown className="size-4 text-[#c6d0dc]" />
        </div>
      </div>
    </header>
  );
}

function LeftSidebar({
  cashAvailable,
  totalPortfolioValue,
  fixture,
}: {
  cashAvailable: number;
  totalPortfolioValue: number;
  fixture: boolean;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-0 border-r border-[#67809640] bg-[#070b10] lg:grid lg:grid-rows-[minmax(0,1fr)_220px]">
      <nav className="min-h-0 space-y-2 overflow-auto px-1 py-2 terminal-scroll" aria-label="Primary">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href === "/overview" && pathname === "/");

          return (
            <Link
              key={href}
              aria-current={active ? "page" : undefined}
              className={`flex h-[44px] w-full items-center gap-3 rounded-[4px] px-4 text-left text-[13px] font-medium transition ${
                active ? "bg-[#162130] text-white" : "text-[#c2ccd8] hover:bg-[#0d141d] hover:text-white"
              }`}
              data-active={active ? "true" : "false"}
              data-testid={`nav-${href.slice(1)}`}
              href={href}
            >
              <Icon className="size-[18px] shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-[#67809633] p-1 pb-3">
        <div className="rounded-[4px] border border-[#67809640] bg-[#090e14] p-3 text-[12px]">
          <SidebarValue label="Buying Power" value={currency(cashAvailable)} />
          <SidebarValue label="Portfolio Value" value={currency(totalPortfolioValue)} />
          <SidebarValue label="Runtime Mode" value={fixture ? "Fixture" : "Live"} />
        </div>

        <div className="rounded-[4px] border border-[#67809640] bg-[#090e14] p-3">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-white">
            <span className="size-2 rounded-full bg-[#22d487]" />
            Paper Trading
          </div>
          <p className="mt-1 pl-4 text-[12px] text-[#9aa7b7]">Simulation Mode</p>
        </div>

        <button className="flex h-8 w-full items-center gap-3 rounded-[4px] px-4 text-left text-[12px] text-[#c2ccd8] hover:bg-[#0d141d]" type="button">
          <ChevronLeft className="size-4" />
          Collapse
        </button>
      </div>
    </aside>
  );
}

function StatusBlock({
  dotTone,
  label,
  detail,
}: {
  dotTone: "positive" | "negative" | "warning";
  label: string;
  detail: string;
}) {
  const dotClass = dotTone === "positive" ? "bg-[#22d487]" : dotTone === "negative" ? "bg-[#ff5a5f]" : "bg-[#c79735]";

  return (
    <div className="flex items-start gap-2 whitespace-nowrap">
      <span className={`mt-1 size-1.5 rounded-full ${dotClass}`} />
      <div>
        <p className="font-semibold leading-4 text-[#dce5ef]">{label}</p>
        <p className="leading-4 text-[#c6d0dc]">{detail}</p>
      </div>
    </div>
  );
}

function TerminalFooter() {
  return (
    <footer className="flex items-center justify-between border-t border-[#7a5a153f] bg-[#17170d] px-4 text-[11px] text-[#c6d0dc]">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 text-[#d5a72c]" />
        <span>Paper trading is for educational purposes only. This product does not place live brokerage orders.</span>
      </div>
      <div className="flex items-center gap-5">
        <span>
          Data provided by <span className="text-[#4ea3ff]">Alpaca Markets</span> when configured
        </span>
        <HeaderDivider />
        <span className="flex items-center gap-3">
          System Status
          <span className="size-1.5 rounded-full bg-[#45d66b]" />
        </span>
      </div>
    </footer>
  );
}

function LogoMark() {
  return (
    <div className="flex size-7 items-center justify-center rounded-[4px] bg-white text-[#070b10]">
      <ShieldCheck className="size-4" strokeWidth={2.4} />
    </div>
  );
}

function HeaderDivider() {
  return <div className="h-7 w-px bg-[#67809659]" />;
}

function SidebarValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[#c2ccd8]">{label}</span>
      <span className="font-mono text-[#e7edf4]">{value}</span>
    </div>
  );
}

function marketStatusLabel(clock: MarketClock | null, providerError?: string) {
  if (!clock && providerError) return "Market Unavailable";
  if (!clock) return "Market Status";
  return clock.isOpen ? "Market Open" : "Market Closed";
}

function marketStatusDetail(clock: MarketClock | null, providerError?: string) {
  if (!clock && providerError) return "Configure Alpaca";
  if (!clock) return "Checking status";

  const target = clock.isOpen ? clock.nextClose : clock.nextOpen;
  const prefix = clock.isOpen ? "Closes" : "Opens";

  return target ? `${prefix} ${relativeDuration(target)}` : formatTimestamp(clock.timestamp, "time");
}

function relativeDuration(value: string) {
  const diffMs = new Date(value).getTime() - Date.now();

  if (!Number.isFinite(diffMs) || diffMs <= 0) return "soon";

  const totalMinutes = Math.round(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) return `in ${hours}h ${minutes}m`;
  return `in ${minutes}m`;
}
