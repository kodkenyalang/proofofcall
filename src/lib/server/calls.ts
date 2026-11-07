import "server-only";
import { scoreCall } from "../scoring";
import type { PublicCall } from "../types";
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
  const outcome = scoreCall(r.entryPrice, exitPrice, r.direction, r.targetBps);
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
