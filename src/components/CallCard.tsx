import Link from "next/link";
import { fmtHorizon, fmtPct, fmtPrice, fmtTime, fmtUsdCents, shortAddr } from "@/lib/format";
import type { PublicCall } from "@/lib/types";

export function StatusBadge({ call }: { call: PublicCall }) {
  if (!call.revealed) {
    return <span className="rounded border border-sealed/40 px-2 py-0.5 font-mono text-[11px] tracking-wider text-sealed">SEALED</span>;
  }
  if (!call.outcome) {
    return <span className="rounded border border-border px-2 py-0.5 font-mono text-[11px] tracking-wider text-muted">SCORING</span>;
  }
  return call.outcome.hit ? (
    <span className="rounded border border-hit/40 px-2 py-0.5 font-mono text-[11px] tracking-wider text-hit">HIT {fmtPct(call.outcome.returnPct)}</span>
  ) : (
    <span className="rounded border border-miss/40 px-2 py-0.5 font-mono text-[11px] tracking-wider text-miss">MISS {fmtPct(call.outcome.returnPct)}</span>
  );
}

export function CallCard({ call }: { call: PublicCall }) {
  return (
    <Link
      href={`/c/${call.id}`}
      className="block rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/50"
    >
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold">{call.asset}</span>
        {call.direction && (
          <span className={`text-xs font-medium uppercase ${call.direction === "long" ? "text-hit" : "text-miss"}`}>
            {call.direction}
          </span>
        )}
        <span className="text-xs text-muted">{fmtHorizon(call.horizonSec)} horizon</span>
        <span className="ml-auto">
          <StatusBadge call={call} />
        </span>
      </div>
      <div className="tabular mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        <span>by <span className="font-mono text-foreground">{shortAddr(call.caller)}</span></span>
        <span>entry {fmtPrice(call.entryPrice)}</span>
        <span>committed {fmtTime(call.committedAt)}</span>
        {!call.revealed && <span>unlock {fmtUsdCents(call.priceCents)} · {call.unlocks} paid</span>}
      </div>
    </Link>
  );
}
