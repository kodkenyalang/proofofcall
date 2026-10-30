# KAIZEN.md: 180 days of daily improvement for Proof of Call

One small, finished improvement per day. Each row names the principle from [AGENT.md](AGENT.md) it applies
and a **done-when** check, so "done" is observable rather than a feeling.

- **Window:** Day 1 = Sat 31 Oct 2026 → Day 180 = Wed 28 Apr 2027.
- **Deadline:** Encode Solana Hackathon 2026 final submission is **Mon 9 Nov 2026, 19:59 GMT+8** (Day 10).
  Phase 1 is built backwards from it. If anything slips, cut scope (not the buffer) and submit what is verified.
- **Cadence:** every 7th day (marked 🔎) is a *hansei* (reflection) day: an A3, fishbone, constraint check,
  5S pass or gate review instead of new work.
- **Rules:** one improvement at a time. If a day slips, don't do two the next day; move the rest down.
  If the constraint (AGENT.md §11) moves, re-order the remaining days to serve it. The plan serves the system.
- **Log:** when a day is done, tick it and add one line of what you learned under *Kaizen log* at the bottom.

## Phase 1: Ship the hackathon (Days 1–10, 31 Oct – 09 Nov 2026)

Prove the full loop with real wallets and real money, then submit. **Hard deadline: Mon 9 Nov 2026, 19:59 GMT+8 (Day 10).** Aim to submit by 12:00 GMT+8, leaving a seven-hour buffer. Gate: **Launch** (submission).

| ✓ | Day | Date | Improvement | Principle | Done when |
|---|---:|---|---|---|---|
| ☐ | 1 | Sat 31 Oct | Make a call with Phantom on devnet against the live URL; note every friction point. | Genchi Genbutsu | A real-wallet call is on the live feed |
| ☐ | 2 | Sun 01 Nov | Unlock that call from a second wallet with faucet USDC, then fix the worst friction found. | Genchi Genbutsu / Kaizen | Caller's USDC rose by the price |
| ☐ | 3 | Mon 02 Nov | Prefix Redis keys with `VERCEL_ENV` so preview and dev can never write production data. | Blast Radius | A preview call doesn't appear on production |
| ☐ | 4 | Tue 03 Nov | Unit tests (hash parity vectors, scoring math, `toBaseUnits`) plus GitHub Actions CI; protect `main`. | Poka-Yoke / Lean (jidoka) | A failing PR cannot merge |
| ☐ | 5 | Wed 04 Nov | Pick a mainnet x402 facilitator and an Aurora key; configure a mainnet Preview environment. | Huawei IPD (decision checkpoint) | Mainnet 402 lists mainnet USDC |
| ☐ | 6 | Thu 05 Nov | Mainnet evidence: $2 Aurora top-up from Base USDC, then a $0.10 paid unlock; record the signatures. | Genchi Genbutsu | Tx links in README, Aurora status `SUCCESS` |
| ☐ | 7 | Fri 06 Nov | 🔎 A3: can a judge try Proof of Call in 60 seconds from a cold browser? | A3 / Genchi Genbutsu | `docs/a3/judge-60s.md` |
| ☐ | 8 | Sat 07 Nov | Empty, loading and error states on every async view; seed 5 real calls so the leaderboard has history. | Omotenashi | Throttled walkthrough has no dead ends |
| ☐ | 9 | Sun 08 Nov | Record the 3-minute demo (problem → commit → unlock → verify → top-up) and write the submission with honest limits. | Lean / TPS (value stream) | Video uploaded; text peer-read |
| ☐ | 10 | Mon 09 Nov | Submit by 12:00 GMT+8 (deadline 19:59); tag `v0.1.0`; freeze `main` until results. | Huawei IPD (launch gate) | Submission confirmed |

## Phase 2: Harden (Days 11–45, 10 Nov – 14 Dec 2026)

Make it reliable, observable and safe to change. Gate: **Verify** (v0.2 reliability).

| ✓ | Day | Date | Improvement | Principle | Done when |
|---|---:|---|---|---|---|
| ☐ | 11 | Tue 10 Nov | Security pass on sign/pay paths: cluster, payee and amount always shown before signing. | Poka-Yoke | `SECURITY.md` checklist |
| ☐ | 12 | Wed 11 Nov | Fix the worst friction from the real-wallet runs that did not make the deadline. | Kaizen | Re-run passes without it |
| ☐ | 13 | Thu 12 Nov | Second mainnet paid unlock from a Solflare wallet; record the signatures. | Genchi Genbutsu (cross-sectional) | Two wallet types proven on mainnet |
| ☐ | 14 | Fri 13 Nov | 🔎 Post-submission hansei: Ishikawa of the 10-day sprint (what slowed us, what we skipped). | Ishikawa | `docs/retro-v0.1.md` |
| ☐ | 15 | Sat 14 Nov | Aurora top-up on a second route (ETH on Arbitrum); compare quote vs actual received. | Genchi Genbutsu | Route table in `docs/` |
| ☐ | 16 | Sun 15 Nov | Rehearse the demo from a cold browser; time each step and cut the slowest. | Theory of Constraints | Demo ≤ 3 min |
| ☐ | 17 | Mon 16 Nov | Publish an honest-limits page: what is verified, what is trusted, what is untested. | Ikigai (audit edge) | Linked from README |
| ☐ | 18 | Tue 17 Nov | Structured JSON log per request (route, callId, outcome, latency). | Genchi Genbutsu | One call traceable end to end |
| ☐ | 19 | Wed 18 Nov | Error monitoring via a Vercel Marketplace observability integration. | Lean / TPS (andon) | A test error alerts you |
| ☐ | 20 | Thu 19 Nov | Write SLOs: register p95 < 5 s, paid-unlock success > 99%, verify passes on 100% of revealed calls. | Lean / TPS | `SLOs.md` |
| ☐ | 21 | Fri 20 Nov | 🔎 A3 on the biggest gap the hackathon exposed (feedback, if any, plus our own list). | A3 | Countermeasure has owner + date |
| ☐ | 22 | Sat 21 Nov | Dedicated server RPC (Helius/Triton) with public RPC as fallback. | Theory of Constraints | Verify p95 before/after recorded |
| ☐ | 23 | Sun 22 Nov | One fetch helper with timeout + jittered backoff + `Retry-After` for RPC, Coinbase and Aurora. | Distributed Systems | Unit-tested and used everywhere |
| ☐ | 24 | Mon 23 Nov | Drill: RPC 500 during registration; UI keeps the signature and retry works. | Chaos Engineering | Drill log |
| ☐ | 25 | Tue 24 Nov | Drill: Coinbase 429; prices stay pending and resolve later. | Chaos Engineering | Drill log |
| ☐ | 26 | Wed 25 Nov | Drill: facilitator down; the reader is not charged and sees a clear message. | Chaos Engineering | Drill log |
| ☐ | 27 | Thu 26 Nov | Drill: Redis down; reads degrade, writes fail closed. | Chaos Engineering / Blast Radius | Drill log |
| ☐ | 28 | Fri 27 Nov | 🔎 A3 on the biggest reliability risk the chaos drills exposed. | A3 / Chaos Engineering | Countermeasure has owner + date |
| ☐ | 29 | Sat 28 Nov | Vercel cron resolves due calls every minute, independent of page views. | Distributed Systems | Calls score with zero traffic |
| ☐ | 30 | Sun 29 Nov | Per-call lock key so overlapping cron runs never double-write. | Poka-Yoke | Concurrency test |
| ☐ | 31 | Mon 30 Nov | Rate-limit `POST /api/calls` per IP and per caller. | Blast Radius | 429 under load test |
| ☐ | 32 | Tue 01 Dec | Store price provenance (source, candle time) and link it on every call page. | Systems Thinking (information flow) | Link opens raw data |
| ☐ | 33 | Wed 02 Dec | Nightly export of `poc:*` keys to private Vercel Blob. | Blast Radius | Backup file exists |
| ☐ | 34 | Thu 03 Dec | Restore drill from backup into a scratch Redis. | Chaos Engineering | Counts match |
| ☐ | 35 | Fri 04 Dec | 🔎 5S pass over the repo: sort, set in order, shine, standardize, sustain. | 5S | Zero warnings; dead code removed |
| ☐ | 36 | Sat 05 Dec | Wallet matrix: Phantom / Solflare / Backpack × v0/v1 × commit/unlock. | Genchi Genbutsu (cross-sectional) | Matrix in `docs/` |
| ☐ | 37 | Sun 06 Dec | Fix the worst cell in the wallet matrix. | Kaizen | Matrix updated |
| ☐ | 38 | Mon 07 Dec | Mobile: commit and unlock inside Phantom's in-app browser. | Genchi Genbutsu | Works on a phone |
| ☐ | 39 | Tue 08 Dec | Accessibility pass: keyboard, contrast, labels. | Omotenashi | axe clean |
| ☐ | 40 | Wed 09 Dec | Privacy-respecting funnel events: commit started/signed/registered, unlock clicked/paid. | Theory of Constraints (measure) | Funnel visible |
| ☐ | 41 | Thu 10 Dec | Rewrite every error string: what happened + what to do next. | Omotenashi | All strings reviewed |
| ☐ | 42 | Fri 11 Dec | 🔎 Measure funnel drop-off per step; name the single current constraint. | Theory of Constraints | Constraint written in KAIZEN log |
| ☐ | 43 | Sat 12 Dec | Extract verification into one pure module shared by `VerifyPanel` and the server. | UNIX Philosophy | Single implementation |
| ☐ | 44 | Sun 13 Dec | Reject malformed signatures/addresses before any network call. | Poka-Yoke | Tests |
| ☐ | 45 | Mon 14 Dec | IPD gate v0.2: reliability checklist; tag a release with changelog. | Huawei IPD | Gate signed; tag pushed |

## Phase 3: First ten callers (Days 46–75, 15 Dec – 13 Jan 2027)

Find product–market pull with real callers and readers. Gate: **10 callers · 50 calls · 20 paid unlocks**.

| ✓ | Day | Date | Improvement | Principle | Done when |
|---|---:|---|---|---|---|
| ☐ | 46 | Tue 15 Dec | Methodology page: commit–reveal, price rule, scoring, what is and isn't trusted. | Ikigai (audit edge) | `/methodology` live |
| ☐ | 47 | Wed 16 Dec | List 30 candidate callers (CT, equity Substacks, analysts you know); rank by fit. | Genchi Genbutsu | Ranked list |
| ☐ | 48 | Thu 17 Dec | Outreach round 1: 10 personalised DMs offering a verifiable track record. | Lean / TPS (pull) | 10 sent |
| ☐ | 49 | Fri 18 Dec | 🔎 Map the reputation loop (R1) and gaming loop (B1) with real numbers; pick one leverage point. | Systems Thinking (Meadows) | System map in `docs/` |
| ☐ | 50 | Sat 19 Dec | Per-call OG image (sealed/revealed, outcome) for X previews. | Omotenashi | X preview renders |
| ☐ | 51 | Sun 20 Dec | Solana Action/Blink so readers unlock inside X. | Samsung TRIZ (taking out) | Unlock works from a Blink |
| ☐ | 52 | Mon 21 Dec | Optional display name + X handle proven by Sign-In-With-Solana. | Poka-Yoke | Verified handle on profile |
| ☐ | 53 | Tue 22 Dec | Watch the first caller make a call without helping; note every pause. | Genchi Genbutsu | Observation notes |
| ☐ | 54 | Wed 23 Dec | Fix the top onboarding issue. | Kaizen | Re-observed without it |
| ☐ | 55 | Thu 24 Dec | Local drafts so callers can write a thesis before committing. | Omotenashi | Draft survives refresh |
| ☐ | 56 | Fri 25 Dec | 🔎 A3: why callers say no (from outreach objections). | A3 | Top 3 objections + countermeasures |
| ☐ | 57 | Sat 26 Dec | Notify the caller on each paid unlock (Marketplace messaging). | Omotenashi | Caller gets a ping |
| ☐ | 58 | Sun 27 Dec | Follow a caller; get notified of new sealed calls. | Systems Thinking (reinforcing loop) | Works end to end |
| ☐ | 59 | Mon 28 Dec | Benchmark-relative return (vs SOL/BTC over the same window). | Ikigai (equities discipline) | Shown beside raw return |
| ☐ | 60 | Tue 29 Dec | Profile metrics: drawdown, return per call, calls per week. | Lean / TPS (measure) | On profile |
| ☐ | 61 | Wed 30 Dec | No leaderboard rank until ≥ 10 resolved calls. | Poka-Yoke (anti-luck) | Rule live |
| ☐ | 62 | Thu 31 Dec | Outreach round 2: 10 DMs; log objections verbatim. | Genchi Genbutsu | Objection log |
| ☐ | 63 | Fri 01 Jan | 🔎 Weekly funnel review; has the constraint moved? | Theory of Constraints | Constraint updated |
| ☐ | 64 | Sat 02 Jan | Orphan-commit indexer: scan each caller's `poc1` memos; flag unregistered ones. | Systems Thinking (close loophole) | Orphan count on profile |
| ☐ | 65 | Sun 03 Jan | Explain orphans on the methodology page and profile. | Omotenashi | Copy live |
| ☐ | 66 | Mon 04 Jan | Required "what would make me wrong" field on every call. | Poka-Yoke | Form enforces it |
| ☐ | 67 | Tue 05 Jan | Suggested unlock price from the caller's record. | Samsung TRIZ (self-service) | Suggestion shown |
| ☐ | 68 | Wed 06 Jan | Caller earnings view reconciled with on-chain USDC. | Genchi Genbutsu | Matches explorer |
| ☐ | 69 | Thu 07 Jan | Moderation policy + report button (no coordinated pumps). | Blast Radius | Policy page live |
| ☐ | 70 | Fri 08 Jan | 🔎 Cross-functional review: investment-advice / finfluencer regulatory exposure. | Huawei IPD | Legal memo + actions |
| ☐ | 71 | Sat 09 Jan | "Not financial advice" disclosure wherever a call renders. | Poka-Yoke | Present on all views |
| ☐ | 72 | Sun 10 Jan | Leaderboard filters: horizon, asset, minimum sample. | Omotenashi | Filters work |
| ☐ | 73 | Mon 11 Jan | Interview 3 readers on willingness to pay. | Genchi Genbutsu | Notes |
| ☐ | 74 | Tue 12 Jan | Design a pricing experiment (A/B suggested prices). | Kaizen | Experiment spec |
| ☐ | 75 | Wed 13 Jan | IPD gate v0.3: 10 active callers, 50 calls, 20 paid unlocks, or an A3 on why not. | Huawei IPD | Gate review |

## Phase 4: Trust minimisation (Days 76–105, 14 Jan – 12 Feb 2027)

Remove the server from integrity and reveal; add equities. Gate: **no trusted server for integrity**.

| ✓ | Day | Date | Improvement | Principle | Done when |
|---|---:|---|---|---|---|
| ☐ | 76 | Thu 14 Jan | Spike drand time-lock encryption so reveals need no server. | Samsung TRIZ (resolve contradiction) | Spike notes |
| ☐ | 77 | Fri 15 Jan | 🔎 A3 decision record: reveal mechanism (time-lock vs server key vs hybrid). | A3 / TRIZ | Decision record committed |
| ☐ | 78 | Sat 16 Jan | Browser time-lock encrypt → store ciphertext → decrypt after the round. | Samsung TRIZ | Demo works |
| ☐ | 79 | Sun 17 Jan | Hybrid (time-lock reveal + server key for paid early unlock) behind a flag. | Blast Radius | Flagged off by default |
| ☐ | 80 | Mon 18 Jan | Enable hybrid encryption for 10% of new calls. | Blast Radius | No errors for 48 h |
| ☐ | 81 | Tue 19 Jan | Ramp hybrid encryption to 100%. | Kaizen | Flag removed |
| ☐ | 82 | Wed 20 Jan | Open-source verifier CLI `npx poc-verify <id>` printing pass/fail lines. | UNIX Philosophy | Published |
| ☐ | 83 | Thu 21 Jan | Re-grant unlocks from the reader's on-chain payment instead of localStorage. | Distributed Systems (chain as truth) | Access works on a new device |
| ☐ | 84 | Fri 22 Jan | 🔎 Ishikawa on every mispriced, late or disputed score so far. | Ishikawa | Root causes + poka-yokes |
| ☐ | 85 | Sat 23 Jan | Pyth API key; dual-run Pyth vs Coinbase for a week before switching. | Dragonwell/AJDK (prove before default) | Dual-run started |
| ☐ | 86 | Sun 24 Jan | Daily diff report of dual-run prices. | Dragonwell/AJDK | Report generated |
| ☐ | 87 | Mon 25 Jan | Add equities (AAPL, NVDA, TSLA) via Pyth. | Ikigai (equities edge) | Equity call scored |
| ☐ | 88 | Tue 26 Jan | Market-hours rule (entry/exit at next open), explained in the form. | Poka-Yoke | Weekend call scored correctly |
| ☐ | 89 | Wed 27 Jan | Publish a daily Merkle root of all registered calls on chain. | Systems Thinking (information flow) | Root tx daily |
| ☐ | 90 | Thu 28 Jan | Verify page checks Merkle inclusion. | Poka-Yoke | Inclusion check passes |
| ☐ | 91 | Fri 29 Jan | 🔎 Cross-sectional gemba walk: follow one call through wallet → RPC → chain → Redis → page, as caller, reader, agent, auditor. | Genchi Genbutsu | Walk notes + 3 fixes |
| ☐ | 92 | Sat 30 Jan | STRIDE threat model of the whole flow. | Blast Radius | `THREAT_MODEL.md` |
| ☐ | 93 | Sun 31 Jan | Fix the top threat. | Kaizen | Closed |
| ☐ | 94 | Mon 01 Feb | Dependency hygiene: pin, Renovate, audit; stay on upstream Kit/x402. | Dragonwell/AJDK | Bot running |
| ☐ | 95 | Tue 02 Feb | Upstream any local patch as a PR. | Dragonwell/AJDK | PR link |
| ☐ | 96 | Wed 03 Feb | Drill: time-lock beacon unavailable at reveal; fallback path works. | Chaos Engineering | Drill log |
| ☐ | 97 | Thu 04 Feb | Drill: clock skew; only block time is ever used. | Distributed Systems | Drill log |
| ☐ | 98 | Fri 05 Feb | 🔎 Chaos game day: combine two failures at once in preview. | Chaos Engineering | Game-day log |
| ☐ | 99 | Sat 06 Feb | Load test 1k calls / 10k reads; name the bottleneck. | Theory of Constraints | Report |
| ☐ | 100 | Sun 07 Feb | Elevate the bottleneck; re-run the load test. | Theory of Constraints | Improved numbers |
| ☐ | 101 | Mon 08 Feb | Ask an auditor or security friend to attack it. | Genchi Genbutsu (other eyes) | Findings list |
| ☐ | 102 | Tue 09 Feb | Close findings (part 1). | Kaizen | Half closed |
| ☐ | 103 | Wed 10 Feb | Close findings (part 2). | Kaizen | All closed |
| ☐ | 104 | Thu 11 Feb | Methodology v2 reflecting the new trust model. | A3 | Page updated |
| ☐ | 105 | Fri 12 Feb | 🔎 IPD gate v0.4: is integrity fully re-derivable from chain + published data? | Huawei IPD | Gate checklist signed |

## Phase 5: Readers & agents (Days 106–140, 13 Feb – 19 Mar 2027)

Make reading, paying and machine access delightful. Gate: **v0.5 readers + agents**.

| ✓ | Day | Date | Improvement | Principle | Done when |
|---|---:|---|---|---|---|
| ☐ | 106 | Sat 13 Feb | x402 Bazaar discovery metadata on the unlock endpoint. | UNIX Philosophy (composable) | Listed |
| ☐ | 107 | Sun 14 Feb | Documented machine feed (OpenAPI) for live calls. | UNIX Philosophy | Spec published |
| ☐ | 108 | Mon 15 Feb | Example agent that buys calls from the top-N verified callers. | UNIX Philosophy | Example repo |
| ☐ | 109 | Tue 16 Feb | Spike an x402 `upto` bundle: all of a caller's live calls this week. | Samsung TRIZ (merging) | Spike notes |
| ☐ | 110 | Wed 17 Feb | Ship the bundle behind a flag. | Blast Radius | Flagged |
| ☐ | 111 | Thu 18 Feb | Reader dashboard: unlocked calls, outcomes, "if followed" P&L. | Omotenashi | Live |
| ☐ | 112 | Fri 19 Feb | 🔎 A3: reader retention (who comes back, who doesn't, why). | A3 | Retention countermeasures |
| ☐ | 113 | Sat 20 Feb | Weekly email digest of followed callers' reveals. | Omotenashi | First digest sent |
| ☐ | 114 | Sun 21 Feb | Kora sponsored fees so callers need zero SOL to commit. | Theory of Constraints | Commit with 0 SOL |
| ☐ | 115 | Mon 22 Feb | Spike an embedded/email wallet for non-crypto readers. | Omotenashi | Spike notes |
| ☐ | 116 | Tue 23 Feb | Aurora preset routes (USDC Base, USDT Tron, ETH Arbitrum). | Omotenashi | Presets live |
| ☐ | 117 | Wed 24 Feb | Show an Aurora dry quote before asking for the refund address. | Omotenashi | Quote shown first |
| ☐ | 118 | Thu 25 Feb | Drill: Aurora late deposit; the refund is visible in the UI. | Chaos Engineering | Drill log |
| ☐ | 119 | Fri 26 Feb | 🔎 Weekly funnel review; name the constraint. | Theory of Constraints | Constraint updated |
| ☐ | 120 | Sat 27 Feb | PWA install + offline shell. | Omotenashi | Installable |
| ☐ | 121 | Sun 28 Feb | Push notification at reveal. | Omotenashi | Notification received |
| ☐ | 122 | Mon 01 Mar | Bahasa Malaysia + Chinese UI for home-market readers. | Ikigai | Locales live |
| ☐ | 123 | Tue 02 Mar | Search by caller and asset. | Omotenashi | Search works |
| ☐ | 124 | Wed 03 Mar | Badges derived only from the on-chain record. | Systems Thinking (incentives) | Badges live |
| ☐ | 125 | Thu 04 Mar | Exclude self-payments from unlock counts (wash unlocking). | Poka-Yoke | Test |
| ☐ | 126 | Fri 05 Mar | 🔎 Ishikawa inventory of gaming vectors (orphans, wash unlocks, sybils, horizon cherry-picking). | Ishikawa / Poka-Yoke | Ranked vector list |
| ☐ | 127 | Sat 06 Mar | Close the top gaming vector from the day-126 inventory. | Kaizen | Closed |
| ☐ | 128 | Sun 07 Mar | Sybil signal: callers sharing a funding source. | Systems Thinking | Signal on profile |
| ☐ | 129 | Mon 08 Mar | Sybil-robust leaderboard (min sample, time-weighting). | Poka-Yoke | New ranking live |
| ☐ | 130 | Tue 09 Mar | p95 TTFB < 300 ms; cache revealed calls. | Lean / TPS (muda) | Measured |
| ☐ | 131 | Wed 10 Mar | Bundle and image diet. | Lean / TPS (muda) | Smaller bundle measured |
| ☐ | 132 | Thu 11 Mar | Separate Redis + Vercel environment per stage. | Blast Radius | No shared data store |
| ☐ | 133 | Fri 12 Mar | 🔎 5S + standardize docs. | 5S | Docs match the code |
| ☐ | 134 | Sat 13 Mar | Mainnet as production default; devnet as staging. | Huawei IPD | Envs switched |
| ☐ | 135 | Sun 14 Mar | Drill: wallet rejects at every step. | Chaos Engineering | Drill log |
| ☐ | 136 | Mon 15 Mar | Accessibility re-audit. | Omotenashi | axe clean |
| ☐ | 137 | Tue 16 Mar | Pitch 3 newsletters / media with live data. | Lean / TPS (pull) | 3 sent |
| ☐ | 138 | Wed 17 Mar | Public metrics page (calls, unlocks, GMV). | Systems Thinking (information flow) | Page live |
| ☐ | 139 | Thu 18 Mar | CONTRIBUTING.md + architecture diagram. | 5S (standardize) | Docs merged |
| ☐ | 140 | Fri 19 Mar | 🔎 IPD gate v0.5: readers and agents. | Huawei IPD | Gate checklist signed |

## Phase 6: Sustainable business (Days 141–180, 20 Mar – 28 Apr 2027)

Economics, legal footing, launch, and the next cycle. Gate: **launch + next-180 plan**.

| ✓ | Day | Date | Improvement | Principle | Done when |
|---|---:|---|---|---|---|
| ☐ | 141 | Sat 20 Mar | Unit economics: revenue per unlock, fee scenarios, infra cost per call. | Ikigai (paid for) | Sheet |
| ☐ | 142 | Sun 21 Mar | A3: platform-fee decision with caller input. | A3 | Decision record |
| ☐ | 143 | Mon 22 Mar | Implement the fee split idempotently (split payment or post-settle sweep). | Distributed Systems | Reconciled on chain |
| ☐ | 144 | Tue 23 Mar | Payout transparency page reconciled to chain. | Genchi Genbutsu | Matches explorer |
| ☐ | 145 | Wed 24 Mar | Caller analytics: who unlocks, conversion. | Omotenashi | Live |
| ☐ | 146 | Thu 25 Mar | Superteam / Solana Foundation grant application. | Huawei IPD | Submitted |
| ☐ | 147 | Fri 26 Mar | 🔎 Ikigai check: still at love × good-at × needed × paid-for? | Ikigai | One-page reflection |
| ☐ | 148 | Sat 27 Mar | Pitch deck v1: problem, evidence, traction. | A3 | Deck |
| ☐ | 149 | Sun 28 Mar | Legal entity, Terms of Service, privacy policy. | Blast Radius | Published |
| ☐ | 150 | Mon 29 Mar | Jurisdiction review: KYC and advice-licensing triggers. | Blast Radius | Memo + actions |
| ☐ | 151 | Tue 30 Mar | Sign one research newsletter as launch partner. | Lean / TPS (pull) | Agreement |
| ☐ | 152 | Wed 31 Mar | Launch plan: one channel, one metric. | Theory of Constraints | Plan |
| ☐ | 153 | Thu 01 Apr | Launch-day runbook + on-call checklist. | Lean / TPS (andon) | Runbook |
| ☐ | 154 | Fri 02 Apr | 🔎 A3 on the pricing & fee decision outcomes. | A3 | Keep / change decision |
| ☐ | 155 | Sat 03 Apr | Launch day: ship and watch dashboards live. | Genchi Genbutsu | Launched |
| ☐ | 156 | Sun 04 Apr | Fix the top launch issue. | Kaizen | Closed |
| ☐ | 157 | Mon 05 Apr | Fix the second launch issue. | Kaizen | Closed |
| ☐ | 158 | Tue 06 Apr | Launch numbers vs plan. | Lean / TPS (measure) | Report |
| ☐ | 159 | Wed 07 Apr | Personally thank the first 50 users; ask each one question. | Omotenashi | 50 replies logged |
| ☐ | 160 | Thu 08 Apr | Resolve the top user contradiction from feedback. | Samsung TRIZ | Shipped |
| ☐ | 161 | Fri 09 Apr | 🔎 Meadows leverage-point review of incentives after launch. | Systems Thinking (Meadows) | One rule change proposed |
| ☐ | 162 | Sat 10 Apr | Kill one low-use feature. | Lean / TPS (muda) | Removed |
| ☐ | 163 | Sun 11 Apr | Quarterly restore drill. | Chaos Engineering | Drill log |
| ☐ | 164 | Mon 12 Apr | Upgrade Next/Kit/x402 on a branch; soak in preview for a week. | Dragonwell/AJDK | Upgrade merged |
| ☐ | 165 | Tue 13 Apr | SLO review; adjust targets. | Lean / TPS | SLOs updated |
| ☐ | 166 | Wed 14 Apr | Publish the `poc1` commitment spec so others can build compatible tools. | UNIX Philosophy | Spec published |
| ☐ | 167 | Thu 15 Apr | Price quorum: median of 2–3 sources for scoring. | Distributed Systems | Quorum live |
| ☐ | 168 | Fri 16 Apr | 🔎 Chaos game day #2 on production-like staging. | Chaos Engineering | Game-day log |
| ☐ | 169 | Sat 17 Apr | Talk to 5 power users about what they'd pay more for. | Ikigai | Notes |
| ☐ | 170 | Sun 18 Apr | Ship the smallest version of their top ask. | Kaizen | Shipped |
| ☐ | 171 | Mon 19 Apr | Community / investor update with metrics. | Omotenashi | Sent |
| ☐ | 172 | Tue 20 Apr | Key-management review (Keychain/KMS for server keys). | Blast Radius | No raw keys in env |
| ☐ | 173 | Wed 21 Apr | CI check: no secrets, no `NEXT_PUBLIC_` misuse. | Poka-Yoke | Check live |
| ☐ | 174 | Thu 22 Apr | Archive dead experiments; prune flags. | 5S (sort) | Flags pruned |
| ☐ | 175 | Fri 23 Apr | 🔎 180-day A3 retrospective: what improved, what didn't, why. | A3 / Kaizen | `docs/a3/180-day-retro.md` |
| ☐ | 176 | Sat 24 Apr | A3: next-180 problem statement. | A3 | A3 |
| ☐ | 177 | Sun 25 Apr | Next-phase charter (market, product, tech). | Huawei IPD | Charter |
| ☐ | 178 | Mon 26 Apr | Update the system map with real data. | Systems Thinking (Meadows) | Map updated |
| ☐ | 179 | Tue 27 Apr | Draft KAIZEN-2 for the next 180 days. | Kaizen | Draft committed |
| ☐ | 180 | Wed 28 Apr | Write the 180-day letter: what we learned, what we'll stop, what we'll start. | Kaizen | Letter committed |

## Kaizen log

One line per completed day: `Day N: what changed · what we learned`.

- Day 0 (30 Oct 2026): MVP deployed to https://proof-of-call-nu.vercel.app on devnet. Learned: shared Redis across
  environments is our largest blast radius → Day 4.
