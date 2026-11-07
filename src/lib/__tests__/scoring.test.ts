import { describe, expect, it } from "vitest";
import { leaderboard, scoreCall, trackRecord } from "../scoring";
import type { PublicCall } from "../types";

describe("scoreCall", () => {
  it("signs the return in the called direction", () => {
    expect(scoreCall(100, 110, "long", null).returnPct).toBeCloseTo(10, 12);
    expect(scoreCall(100, 110, "short", null).returnPct).toBeCloseTo(-10, 12);
    expect(scoreCall(100, 90, "short", null).returnPct).toBeCloseTo(10, 12);
  });

  it("reproduces the live production call's score", () => {
    // 41581a66e249c4cc: SOL long, entry 95.52, exit 95.36, target +2%.
    expect(scoreCall(95.52, 95.36, "long", 200)).toEqual({
      exitPrice: 95.36,
      returnPct: -0.16750418760468344,
      hit: false,
      targetHit: false,
    });
  });

  it("counts a flat call as a miss", () => {
    expect(scoreCall(100, 100, "long", null).hit).toBe(false);
    expect(scoreCall(100, 100, "short", null).hit).toBe(false);
  });

  it("has no target result when no target was set", () => {
    expect(scoreCall(100, 200, "long", null).targetHit).toBeNull();
  });

  // Regression: (115 / 100 - 1) * 100 is 14.999999999999991 in floating point, so a call that
  // landed exactly on +15% used to score targetHit: false.
  it.each([
    [100, 115, "long", 1500],
    [2, 2.3, "long", 1500],
    [100, 85, "short", 1500],
    [95.52, 96.4752, "long", 100],
  ] as const)("hits a target reached exactly (%s → %s %s, %s bps)", (entry, exit, dir, bps) => {
    expect(scoreCall(entry, exit, dir, bps).targetHit).toBe(true);
  });

  it("misses a target by one cent", () => {
    expect(scoreCall(100, 114.99, "long", 1500).targetHit).toBe(false);
    expect(scoreCall(100, 85.01, "short", 1500).targetHit).toBe(false);
  });

  it("never hits a target in the wrong direction", () => {
    expect(scoreCall(100, 85, "long", 1500).targetHit).toBe(false);
  });
});

const call = (over: Partial<PublicCall>): PublicCall => ({
  id: "x",
  caller: "A",
  asset: "SOL",
  horizonSec: 3600,
  priceCents: 25,
  commitHash: "h",
  commitSig: "s",
  committedAt: 0,
  revealAt: 3600,
  entryPrice: 100,
  revealed: true,
  unlocks: 0,
  direction: "long",
  targetBps: null,
  thesis: "t",
  salt: "00",
  outcome: null,
  ...over,
});
const scored = (caller: string, ret: number, unlocks = 0) =>
  call({ caller, unlocks, outcome: { exitPrice: 100 + ret, returnPct: ret, hit: ret > 0, targetHit: null } });

describe("trackRecord", () => {
  it("summarises resolved and live calls for one caller", () => {
    const calls = [
      scored("A", 5, 2),
      scored("A", -2, 1),
      call({ caller: "A", revealed: false, direction: null, unlocks: 3 }),
      scored("B", 50),
    ];
    expect(trackRecord("A", calls)).toEqual({
      caller: "A",
      resolved: 2,
      live: 1,
      hits: 1,
      hitRate: 0.5,
      avgReturnPct: 1.5,
      sumReturnPct: 3,
      best: 5,
      worst: -2,
      unlocks: 6,
    });
  });

  it("reports nulls, not zeros, before anything resolves", () => {
    const r = trackRecord("A", [call({ revealed: false })]);
    expect(r).toMatchObject({ resolved: 0, live: 1, hitRate: null, avgReturnPct: null, best: null, worst: null });
  });
});

describe("leaderboard", () => {
  it("ranks by summed return, then by sample size", () => {
    const board = leaderboard([scored("A", 1), scored("B", 3), scored("C", 2), scored("C", 1), scored("D", 3)]);
    expect(board.map((r) => r.caller)).toEqual(["C", "B", "D", "A"]);
  });
});
