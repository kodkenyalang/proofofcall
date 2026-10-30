import "server-only";
import type { PublicCall, TrackRecord } from "../types";
import { priceAt } from "./prices";
import { type CallRecord, listCalls, updateCall } from "./store";

const now = () => Math.floor(Date.now() / 1000);

// Fill in prices as the market prints them: the entry price a minute after the commit,
// then the exit price and score once the horizon has passed. Scoring is deterministic from
// (entryPrice, exitPrice, direction, targetBps), so anyone can recompute it.
export async function resolveIfDue(r: CallRecord): Promise<CallRecord> {
  if (r.entryPrice == null) {
    try {
      const entryPrice = await priceAt(r.asset, r.committedAt);
      r = (await updateCall(r.id, (x) => void (x.entryPrice = entryPrice))) ?? r;
    } catch {
      return r; // not printed yet; try again on a later read
    }
  }
  if (r.outcome || now() < r.revealAt || r.entryPrice == null) return r;
  let exitPrice: number;
  try {
    exitPrice = await priceAt(r.asset, r.revealAt);
  } catch {
    return r;
  }
  const sign = r.direction === "long" ? 1 : -1;
  const returnPct = (exitPrice / r.entryPrice - 1) * 100 * sign;
  const outcome = {
    exitPrice,
    returnPct,
    hit: returnPct > 0,
    targetHit: r.targetBps == null ? null : returnPct * 100 >= r.targetBps,
  };
  return (await updateCall(r.id, (x) => void (x.outcome = outcome))) ?? r;
}

export function toPublic(r: CallRecord, opts: { unlocked?: boolean } = {}): PublicCall {
  const revealed = now() >= r.revealAt;
  const open = revealed || opts.unlocked === true;
  return {
    id: r.id,
    caller: r.caller,
    asset: r.asset,
    horizonSec: r.horizonSec,
    priceCents: r.priceCents,
    commitHash: r.commitHash,
    commitSig: r.commitSig,
    committedAt: r.committedAt,
    revealAt: r.revealAt,
    entryPrice: r.entryPrice,
    revealed,
    unlocks: r.unlocks,
    direction: open ? r.direction : null,
    targetBps: open ? r.targetBps : null,
    thesis: open ? r.thesis : null,
    // The salt is only published at reveal; it lets anyone recompute the on-chain hash.
    salt: revealed ? r.salt : null,
    outcome: revealed ? r.outcome : null,
  };
}

export async function allPublicCalls(): Promise<PublicCall[]> {
  const records = await Promise.all((await listCalls()).map(resolveIfDue));
  return records.sort((a, b) => b.committedAt - a.committedAt).map((r) => toPublic(r));
}

export function trackRecord(caller: string, calls: PublicCall[]): TrackRecord {
  const mine = calls.filter((c) => c.caller === caller);
  const scored = mine.filter((c) => c.outcome).map((c) => c.outcome!);
  const returns = scored.map((o) => o.returnPct);
  const hits = scored.filter((o) => o.hit).length;
  const sum = returns.reduce((a, b) => a + b, 0);
  return {
    caller,
    resolved: scored.length,
    live: mine.filter((c) => !c.revealed).length,
    hits,
    hitRate: scored.length ? hits / scored.length : null,
    avgReturnPct: scored.length ? sum / scored.length : null,
    sumReturnPct: sum,
    best: returns.length ? Math.max(...returns) : null,
    worst: returns.length ? Math.min(...returns) : null,
    unlocks: mine.reduce((a, c) => a + c.unlocks, 0),
  };
}

export function leaderboard(calls: PublicCall[]): TrackRecord[] {
  const callers = [...new Set(calls.map((c) => c.caller))];
  return callers
    .map((c) => trackRecord(c, calls))
    .sort((a, b) => b.sumReturnPct - a.sumReturnPct || b.resolved - a.resolved);
}
