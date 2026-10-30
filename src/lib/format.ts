export const shortAddr = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;

export function fmtPrice(n: number | null) {
  if (n == null) return "pending";
  if (n >= 1) return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
  return `$${n.toPrecision(4)}`;
}

export const fmtPct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
export const fmtUsdCents = (c: number) => `$${(c / 100).toFixed(2)}`;

export function fmtHorizon(sec: number) {
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  if (sec < 86_400) return `${Math.round(sec / 3600)}h`;
  return `${Math.round(sec / 86_400)}d`;
}

export function fmtTime(unix: number) {
  return new Date(unix * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function fmtCountdown(unix: number, nowMs = Date.now()) {
  const s = Math.max(0, Math.floor(unix - nowMs / 1000));
  const d = Math.floor(s / 86_400);
  const h = Math.floor((s % 86_400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m ${s % 60}s`;
}
