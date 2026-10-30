import type { Asset } from "./config";
import type { Direction } from "./commitment";

export type Outcome = {
  exitPrice: number;
  returnPct: number; // signed in the called direction
  hit: boolean;
  targetHit: boolean | null;
};

// What anyone can see. Sealed fields are null until the horizon passes (or the reader pays).
export type PublicCall = {
  id: string;
  caller: string;
  asset: Asset;
  horizonSec: number;
  priceCents: number;
  commitHash: string;
  commitSig: string;
  committedAt: number;
  revealAt: number;
  entryPrice: number | null;
  revealed: boolean;
  unlocks: number;
  direction: Direction | null;
  targetBps: number | null;
  thesis: string | null;
  salt: string | null;
  outcome: Outcome | null;
};

export type TrackRecord = {
  caller: string;
  resolved: number;
  live: number;
  hits: number;
  hitRate: number | null;
  avgReturnPct: number | null;
  sumReturnPct: number;
  best: number | null;
  worst: number | null;
  unlocks: number;
};
