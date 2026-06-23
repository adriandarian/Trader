export function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function signedCurrency(value: number) {
  const formatted = currency(Math.abs(value));
  return `${value >= 0 ? "+" : "-"}${formatted}`;
}

export function percent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function valueTone(value: number) {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

export function toneClass(tone: string) {
  if (tone === "positive") return "text-[#91d66f]";
  if (tone === "negative") return "text-[#ff666b]";
  if (tone === "warning") return "text-[#dfc27c]";
  return "text-[#f1f5f9]";
}

export function formatTimestamp(value: string | null | undefined, mode: "time" | "datetime" = "datetime") {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    ...(mode === "datetime" ? { month: "short", day: "numeric" } : {}),
  }).format(new Date(value));
}
