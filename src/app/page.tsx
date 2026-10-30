import Link from "next/link";
import { connection } from "next/server";
import { CallCard } from "@/components/CallCard";
import { allPublicCalls, leaderboard } from "@/lib/server/calls";
import { fmtPct, shortAddr } from "@/lib/format";

export default async function Home() {
  await connection(); // always render from the live store
  const calls = await allPublicCalls();
  const board = leaderboard(calls);

  return (
    <div className="space-y-10">
      <section className="max-w-2xl space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Calls you can’t delete.</h1>
        <p className="text-muted">
          Every call is hashed onto Solana <i>before</i> the move and scored against market prices when its horizon
          ends. Track records are audited by the chain, not by the caller. Pay a few cents to read a live call
          early. The payment goes straight to the caller.
        </p>
        <Link href="/new" className="inline-block rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
          Make a call
        </Link>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted">Latest calls</h2>
          {calls.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
              No calls yet. Be the first on the record.
            </p>
          )}
          {calls.map((c) => (
            <CallCard key={c.id} call={c} />
          ))}
        </section>

        <aside className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted">Audited leaderboard</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <table className="tabular w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr>
                  <th className="px-3 py-2 font-normal">Caller</th>
                  <th className="px-3 py-2 text-right font-normal">Hit</th>
                  <th className="px-3 py-2 text-right font-normal">Σ return</th>
                </tr>
              </thead>
              <tbody>
                {board.map((r) => (
                  <tr key={r.caller} className="border-t border-border">
                    <td className="px-3 py-2">
                      <Link href={`/u/${r.caller}`} className="font-mono text-xs hover:text-accent">
                        {shortAddr(r.caller)}
                      </Link>
                      <span className="ml-1 text-xs text-muted">({r.resolved})</span>
                    </td>
                    <td className="px-3 py-2 text-right">{r.hitRate == null ? "–" : `${Math.round(r.hitRate * 100)}%`}</td>
                    <td className={`px-3 py-2 text-right ${r.sumReturnPct >= 0 ? "text-hit" : "text-miss"}`}>
                      {r.resolved ? fmtPct(r.sumReturnPct) : "–"}
                    </td>
                  </tr>
                ))}
                {board.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-xs text-muted">Empty</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </aside>
      </div>
    </div>
  );
}
