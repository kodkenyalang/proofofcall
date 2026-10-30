import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/CallCard";
import { UnlockPanel } from "@/components/UnlockPanel";
import { VerifyPanel } from "@/components/VerifyPanel";
import { resolveIfDue, toPublic } from "@/lib/server/calls";
import { getCall } from "@/lib/server/store";
import { fmtHorizon, fmtPct, fmtPrice, fmtTime, shortAddr } from "@/lib/format";

export default async function CallPage({ params }: PageProps<"/c/[id]">) {
  await connection(); // always render from the live store
  const record = await getCall((await params).id);
  if (!record) notFound();
  const call = toPublic(await resolveIfDue(record));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold">{call.asset}</h1>
            <StatusBadge call={call} />
          </div>
          <p className="text-sm text-muted">
            by{" "}
            <Link href={`/u/${call.caller}`} className="font-mono text-foreground hover:text-accent">
              {shortAddr(call.caller)}
            </Link>{" "}
            · {fmtHorizon(call.horizonSec)} horizon · committed {fmtTime(call.committedAt)}
          </p>
        </div>

        <dl className="tabular grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border text-sm sm:grid-cols-4">
          {[
            ["Entry", fmtPrice(call.entryPrice)],
            ["Exit", call.outcome ? fmtPrice(call.outcome.exitPrice) : "–"],
            ["Return", call.outcome ? fmtPct(call.outcome.returnPct) : "–"],
            ["Ends", fmtTime(call.revealAt)],
          ].map(([k, v]) => (
            <div key={k} className="bg-surface p-3">
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="mt-1 font-medium">{v}</dd>
            </div>
          ))}
        </dl>

        {call.revealed ? (
          <div className="space-y-3 rounded-xl border border-border bg-surface p-5">
            <p className="text-2xl font-semibold">
              <span className={call.direction === "long" ? "text-hit" : "text-miss"}>{call.direction?.toUpperCase()}</span>{" "}
              {call.asset}
              {call.targetBps ? (
                <span className="text-base text-muted">
                  {" "}· target {(call.targetBps / 100).toFixed(1)}%
                  {call.outcome?.targetHit != null && (call.outcome.targetHit ? " ✓ reached" : " ✗ not reached")}
                </span>
              ) : null}
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{call.thesis}</p>
          </div>
        ) : (
          <UnlockPanel call={call} />
        )}

        <p className="text-xs text-muted">
          Scoring: entry and exit are the open of the first full 1-minute Coinbase candle at or after the commit
          block time and the horizon end. Return is signed in the called direction. A hit is any positive return.
        </p>
      </div>
      <VerifyPanel call={call} />
    </div>
  );
}
