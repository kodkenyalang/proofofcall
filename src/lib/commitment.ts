// Commit-reveal scheme shared by browser and server. Both sides must hash identically,
// so the preimage is a JSON array with a fixed field order (no key-ordering ambiguity).

import type { Asset } from "./config";

export type Direction = "long" | "short";

export type CallContent = {
  caller: string; // base58 wallet address that signs the memo
  asset: Asset;
  direction: Direction;
  horizonSec: number;
  targetBps: number | null; // optional directional target, e.g. 1500 = +15% in the called direction
  priceCents: number; // x402 unlock price while the call is live
  thesis: string;
  salt: string; // 32 random bytes, hex — stops brute-forcing the sealed direction
};

export const MEMO_PREFIX = "poc1:";

export function commitmentPreimage(c: CallContent): string {
  return JSON.stringify([
    1,
    c.caller,
    c.asset,
    c.direction,
    c.horizonSec,
    c.targetBps,
    c.priceCents,
    c.thesis,
    c.salt,
  ]);
}

export async function commitmentHash(c: CallContent): Promise<string> {
  const bytes = new TextEncoder().encode(commitmentPreimage(c));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export const commitmentMemo = (hash: string) => `${MEMO_PREFIX}${hash}`;

export function randomSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
