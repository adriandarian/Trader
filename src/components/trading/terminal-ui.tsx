import { AlertTriangle, BarChart3, FileText, Info, Search } from "lucide-react";

import { toneClass } from "./format";

export function TerminalPanel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[4px] border border-[#67809640] bg-[#0d141d] ${className}`}>
      <div className="flex min-h-10 items-center justify-between gap-3 border-b border-[#67809633] px-3">
        <h2 className="text-[15px] font-semibold text-white">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function MetricCard({
  label,
  value,
  support,
  tone = "neutral",
  info,
}: {
  label: string;
  value: string;
  support?: string;
  tone?: "positive" | "negative" | "neutral" | "warning";
  info?: boolean;
}) {
  return (
    <div className="h-[94px] rounded-[4px] border border-[#67809640] bg-[#0d141d] p-3 shadow-[0_8px_20px_rgba(0,0,0,0.16)]">
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#c2ccd8]">
        <span className="truncate">{label}</span>
        {info ? <Info className="size-3.5 shrink-0 text-[#8b98a8]" /> : null}
      </div>
      <p className={`mt-3 font-mono text-[20px] font-semibold leading-none ${toneClass(tone)}`}>{value}</p>
      {support ? <p className={`mt-2 font-mono text-[12px] ${toneClass(tone === "neutral" ? "muted" : tone)}`}>{support}</p> : null}
    </div>
  );
}

export function EmptyState({
  icon = "file",
  title,
  body,
  action,
}: {
  icon?: "file" | "search" | "chart" | "warning";
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  const Icon = icon === "search" ? Search : icon === "chart" ? BarChart3 : icon === "warning" ? AlertTriangle : FileText;

  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center px-6 py-8 text-center">
      <Icon className="mb-3 size-12 text-[#778494]" strokeWidth={1.4} />
      <p className="text-[15px] font-semibold text-white">{title}</p>
      <p className="mt-2 max-w-[430px] text-[12px] leading-5 text-[#9aa7b7]">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function DataStatusBadge({
  tone,
  label,
}: {
  tone: "positive" | "negative" | "warning" | "neutral";
  label: string;
}) {
  const dotClass =
    tone === "positive" ? "bg-[#22d487]" : tone === "negative" ? "bg-[#ff5a5f]" : tone === "warning" ? "bg-[#c79735]" : "bg-[#8794a4]";

  return (
    <span className="inline-flex h-7 items-center gap-2 rounded-[4px] border border-[#67809633] bg-[#0a1017] px-2.5 text-[12px] text-[#d7e0eb]">
      <span className={`size-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}

export function SegmentedControl({
  options,
  value,
  compact = false,
}: {
  options: readonly string[];
  value: string;
  compact?: boolean;
}) {
  return (
    <div className={`flex overflow-hidden rounded-[4px] border border-[#67809633] bg-[#0a1017] ${compact ? "border-0 bg-transparent" : ""}`}>
      {options.map((option) => (
        <button
          key={option}
          className={`${compact ? "h-8 px-2.5" : "h-8 px-3.5"} font-mono text-[12px] ${
            value === option ? "rounded-[4px] bg-[#1a2635] text-white" : "text-[#a8b3c0]"
          }`}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function TableShell({
  columns,
  rows,
}: {
  columns: string[];
  rows: React.ReactNode;
}) {
  return (
    <table className="w-full table-fixed text-[12px]">
      <thead className="h-9 bg-[#111a25] text-[#b5c0ce]">
        <tr>
          {columns.map((head) => (
            <th key={head} className="px-3 text-left font-medium">
              {head}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

export function ChartFrame({
  children,
  height = "h-[216px]",
}: {
  children?: React.ReactNode;
  height?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-[#0d141d] chart-grid ${height}`}>
      <div className="absolute inset-x-0 bottom-8 top-2 grid grid-rows-5">
        {["10K", "5K", "0", "-5K", "-10K"].map((tick) => (
          <div key={tick} className="relative border-b border-[#67809622]">
            <span className="absolute -top-2 left-2 font-mono text-[11px] text-[#9aa7b7]">{tick}</span>
          </div>
        ))}
      </div>
      {children}
      <div className="absolute inset-x-[34px] bottom-2 flex justify-between font-mono text-[11px] text-[#9aa7b7]">
        {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>
    </div>
  );
}

export function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(...values.map((value) => Math.abs(value)), 1);

  return (
    <div className="flex h-full items-end gap-1 px-4 py-5">
      {values.map((value, index) => (
        <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center justify-end gap-1">
          <div
            className={`w-full max-w-8 rounded-t-[2px] ${value >= 0 ? "bg-[#4ea3ff]" : "bg-[#ff666b]"}`}
            style={{ height: `${Math.max(10, (Math.abs(value) / max) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}
