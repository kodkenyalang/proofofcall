# A3: A call that lands exactly on its target scored as a miss

**Date:** Mon 2 Nov 2026 (KAIZEN Day 4) · **Owner:** Aaron · **Status:** countermeasure shipped, follow-up open

## Background

Each call can carry an optional sealed target (`targetBps`, e.g. `1500` = +15% in the called direction). At reveal,
`targetHit` records whether the return reached it. The result is public and anyone can recompute it from the
entry price, exit price, direction and target. An auditor would reject a score that disagrees with arithmetic done
by hand.

## Current condition (observed, not assumed)

The Day 4 scoring tests ran the rule on round numbers:

| Entry | Exit | Direction | Target | `returnPct` (float) | `targetHit` before |
|---:|---:|---|---:|---:|---|
| 100 | 115 | long | 1500 | 14.999999999999991 | **false** ✗ |
| 2 | 2.3 | long | 1500 | 14.999999999999991 | **false** ✗ |
| 100 | 85 | short | 1500 | 15.000000000000002 | true |
| 95.52 | 96.4752 | long | 100 | 1.0000000000000009 | true |

The outcome depends on which way the float error rounds, so it isn't a stable rule. Production impact so far:
none. The only scored call (`41581a66e249c4cc`, target +2%, return -0.17%) is far from its target.

## Goal

A call that reaches its target exactly scores `targetHit: true` whichever way the float error falls, and a call
that misses by a real price tick still scores `false`.

## Root cause (fishbone, short form)

- **Method:** the rule compares two floats with `>=` and no tolerance. *(root cause)*
- **Measurement:** no tests existed for scoring, so nothing exercised the boundary. *(why it was not caught)*
- Machine, Material, People, Environment: not involved. Coinbase prices are exact decimals; the error comes from
  the division.

## Countermeasures

1. `scoreCall` (now in `src/lib/scoring.ts`) compares `returnPct * 100 >= targetBps - 1e-6`. A tolerance of 1e-6 bps
   is about 10⁻¹⁰ in relative terms, many orders of magnitude below one price tick, so it absorbs float error and
   nothing else.
2. Poka-yoke: `src/lib/__tests__/scoring.test.ts` pins the four boundary cases above, plus misses by one cent in
   each direction. With the tolerance removed, the two long cases fail, so the test catches a regression.
3. CI runs the tests on every PR, and `main` requires a green CI.

## Loops touched (AGENT.md §2)

Information flow into **reader trust** (B1 guard): published scores must match hand arithmetic. This changes the
rule's boundary only, not any parameter readers rely on.

## Follow-up

- **Methodology page** (KAIZEN Day 46): state the tolerance next to the target rule.
- **Re-score check:** before the fix ships to production, confirm no stored call has an outcome inside the
  tolerance band. Checked 2 Nov: the only production outcome is -0.17% against a +2% target. No re-score needed.
