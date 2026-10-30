import { connection } from "next/server";
import { CallCard } from "@/components/CallCard";
import { allPublicCalls, trackRecord } from "@/lib/server/calls";
import { fmtPct } from "@/lib/format";

export default async function CallerPage({ params }: PageProps<"/u/[address]">) {
  await connection(); // always render from the live store
  const { address } = await params;
  const calls = (await allPublicCalls()).filter((c) => c.caller === address);
  const r = trackRecord(address, calls);

  const stats: [string, string][] = [
    ["Resolved", String(r.resolved)],
    ["Hit rate", r.hitRate == null ? "–" : `${Math.round(r.hitRate * 100)}%`],
    ["Avg return", r.avgReturnPct == null ? "–" : fmtPct(r.avgReturnPct)],
    ["Best / worst", r.best == null ? "–" : `${fmtPct(r.best)} / ${fmtPct(r.worst!)}`],
    ["Live", String(r.live)],
    ["Paid unlocks", String(r.unlocks)],
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted">Track record</p>
        <h1 className="break-all font-mono text-lg">{address}</h1>
      </div>
      <dl className="tabular grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border text-sm sm:grid-cols-6">
        {stats.map(([k, v]) => (
          <div key={k} className="bg-surface p-3">
            <dt className="text-xs text-muted">{k}</dt>
            <dd className="mt-1 font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="space-y-3">
        {calls.map((c) => (
          <CallCard key={c.id} call={c} />
        ))}
      </div>
    </div>
  );
}
