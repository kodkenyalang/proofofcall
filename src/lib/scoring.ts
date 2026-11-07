// Scoring and track records. Pure functions of public data, so anyone can recompute them.

import type { Direction } from "./commitment";
import type { Outcome, PublicCall, TrackRecord } from "./types";

// Prices are floats, so (115 / 100 - 1) * 100 is 14.999999999999991, not 15. Without a tolerance,
// a call that lands exactly on its target would score as a miss. 1e-6 bps is far below any real
// price tick, so this only absorbs float error.
const TARGET_EPSILON_BPS = 1e-6;

// Return is signed in the called direction. A hit is any positive return; the target is hit
// when that return reaches targetBps (1500 = +15% in the called direction).
export function scoreCall(
  entryPrice: number,
  exitPrice: number,
  direction: Direction,
  targetBps: number | null,
): Outcome {
  const sign = direction === "long" ? 1 : -1;
  const returnPct = (exitPrice / entryPrice - 1) * 100 * sign;
  return {
    exitPrice,
    returnPct,
    hit: returnPct > 0,
    targetHit: targetBps == null ? null : returnPct * 100 >= targetBps - TARGET_EPSILON_BPS,
  };
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
