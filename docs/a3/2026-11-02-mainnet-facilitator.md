# A3: Which x402 facilitator settles mainnet unlocks, and how do we stage mainnet?

**Date:** Mon 2 Nov 2026 (KAIZEN Day 5, IPD decision checkpoint) · **Owner:** Aaron · **Status:** decided, mainnet
preview live, Aurora key open

## Background

Unlocks are paid over x402. A facilitator verifies the reader's signed USDC transfer, pays the network fee and
submits it. On devnet we use `x402.org/facilitator`. Day 6 needs real mainnet evidence (a $0.10 paid unlock and an
Aurora top-up), so today we choose a mainnet facilitator and stand up a mainnet environment that cannot touch
devnet data.

## Current condition (seen, 2 Nov 2026)

Each facilitator's `/supported` was queried directly. `/verify` and `/settle` were then called with a deliberately
invalid payload to test whether a key is required.

| Facilitator | Solana mainnet `exact` (v2) | Key needed | Fee payer (reader needs no SOL) | Notes |
|---|---|---|---|---|
| x402.org | **no**, devnet only | no | `CKPK…WYp5` (devnet) | Advertises tx versions `[0,1]` |
| PayAI `facilitator.payai.network` | yes | **no**: `400 invalid_payload`, not `401` | `CjNF…eKww` | No payment floor; `bazaar` extension; devnet too |
| Dexter `x402.dexter.cash` | yes | **no**: `policy:amount_below_floor` | `DeXt…oAb8` | Dynamic floor ≈ $0.001 (our minimum is $0.01); `bazaar`; devnet too |
| Coinbase CDP | not checked | **yes**: `/supported` is `401` | n/a | Needs CDP keys and an extra dependency |

**End to end on our code** (local `next dev`, `NEXT_PUBLIC_SOLANA_CLUSTER=mainnet`, file store, fixture call paying a
wallet that has a USDC account), using `node scripts/x402-challenge.ts`:

- PayAI: `402`, network `solana:5eykt4Us…`, asset `EPjFWdd5…Dt1v` (mainnet USDC), `payTo` = caller, amount
  `100000` for $0.10, fee payer `CjNF…eKww`. ✓
- Dexter: identical, fee payer `DeXt…oAb8`. ✓
- x402.org on mainnet: the server throws `RouteConfigurationError: Facilitator does not support scheme "exact" on
  network solana:5eykt4Us…` on the first unlock and the process dies. This **fails closed**: no sealed call is
  served and nothing is charged. It is a crash rather than a clean 503, though.
- A fixture caller with **no** USDC account got `409` before the paywall on mainnet too (the Day 2 guard). ✓

**Other things seen on the way:**

- **Blast radius.** A mainnet preview would have shared `preview:poc:*` with devnet previews, so devnet calls
  (whose signatures don't exist on mainnet) would appear in a mainnet feed and fail verification. The same would
  happen to production when it moves to mainnet.
- **Tx version.** PayAI and Dexter don't advertise `transactionVersions`, so `@x402/svm` builds **v0** payment
  transactions on mainnet. x402.org advertises `[0,1]`, so on devnet the client builds **v1**. Today's devnet
  rehearsal therefore does not exercise the mainnet payment path.
- **Aurora.** `GET /api/tokens/<anything>` is public (210 tokens, Solana USDC = `nep141:sol-5ce3…omft.near`).
  `quote` and `status` answer `404 "Application key not found"` without a valid key, so a key is required for any
  top-up.
- **Public mainnet RPC** answered `429` to `getTokenLargestAccounts` and `getTransaction` within a few calls
  (relevant to KAIZEN Day 22).

## Goal

The Day 5 done-when check: a mainnet `402` lists mainnet USDC, from an environment that cannot read or write devnet
or production data, and with a rollback that is one setting change.

## Decision

1. **Primary facilitator: PayAI** (`https://facilitator.payai.network`). It needs no key, has no payment floor
   (Dexter's floor sits close to cheap unlocks), and offers the `bazaar` extension we want for discovery (Day 106).
   **Fallback: Dexter.** Switching is one environment variable.
2. **Not CDP for now.** It needs keys plus another dependency, for no benefit we need before the deadline.
3. **Stage mainnet as a branch-scoped Vercel Preview.** Git branch `mainnet-preview` gets
   `NEXT_PUBLIC_SOLANA_CLUSTER=mainnet` and `X402_FACILITATOR_URL=https://facilitator.payai.network`. Every other
   preview, and production, stays on devnet. URL:
   https://proof-of-call-git-mainnet-preview-kod-kenyalangs-projects.vercel.app (behind Vercel deployment
   protection).
4. **Per-cluster key namespace** (poka-yoke): `keyPrefix(env, cluster)` gives `preview:mainnet:poc:*` and, later,
   `mainnet:poc:*` in production. Devnet production keeps `poc:*`. A unit test checks that no two namespaces overlap.

## Root cause analysis (why this needed a checkpoint, not just a config value)

- **Method:** the cluster was a deploy-time flag but not part of the data identity, so the key namespace couldn't
  tell clusters apart.
- **Machine:** the facilitator list differs per network, and a wrong pick crashes the unlock function at runtime,
  not at build time.
- **Measurement:** nothing checked a deployed 402 against the cluster. `scripts/x402-challenge.ts` now does.

## Countermeasures and plan

| # | Countermeasure | Owner | When | Status |
|---|---|---|---|---|
| 1 | `keyPrefix` includes the cluster; tests prove no overlap | agent | 2 Nov | ✓ |
| 2 | `scripts/x402-challenge.ts` as the gate before promoting any mainnet deploy | agent | 2 Nov | ✓ |
| 3 | Branch-scoped mainnet preview with PayAI | agent | 2 Nov | ✓ live, empty feed |
| 4 | Create an Aurora app at studio.aurora.dev; add `AURORA_API_KEY` to Preview (`mainnet-preview`) | **Aaron** | before Day 6 | open |
| 5 | Optional: a dedicated mainnet RPC for the browser (`NEXT_PUBLIC_SOLANA_RPC_URL`, same branch scope) | Aaron | before Day 6 | open |
| 6 | Proposed: point devnet at PayAI's devnet facilitator too, so the Day 2 rehearsal uses the same facilitator and tx version (v0) as mainnet | Aaron to decide | Day 6 | proposed |
| 7 | Turn the facilitator crash into a clean `503` that names the facilitator (fail closed, but loudly) | backlog | Day 26 drill | proposed |

## Follow-up (Day 6)

Once a real mainnet call exists on the preview, run:

```bash
NEXT_PUBLIC_SOLANA_CLUSTER=mainnet node scripts/x402-challenge.ts \
  https://proof-of-call-git-mainnet-preview-kod-kenyalangs-projects.vercel.app/api/calls/<id>/unlock <caller> 100000
```

(Deployment protection is on, so either use a bypass token or run it from the browser's network tab.) Then pay the
$0.10 from a second wallet and record both signatures in the README.
