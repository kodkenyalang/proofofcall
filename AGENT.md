# AGENT.md: How we work on Proof of Call

Rules for anyone (human or agent) changing this repository. Each principle below is turned into specific
rules for *this* codebase. Read [AGENTS.md](AGENTS.md) as well: it holds the Next.js version notice that
`next dev` maintains.

**What the product is.** Callers commit market calls on Solana before the move. Calls are scored
against market prices at the horizon. Readers pay per live call over x402, and anyone can re-verify any
call from the chain. Integrity comes from the chain. The server is trusted only for confidentiality until
reveal and for applying the published price rule. Every change must keep that sentence true or
deliberately shrink the server's role.

---

## 1. Ikigai: why this exists

Proof of Call sits where four things meet:

| | |
|---|---|
| What we're good at | Audit & assurance, equities research, data pipelines |
| What the world needs | Track records that can't be backdated, edited or deleted |
| What people pay for | Early access to a call from someone with a proven record |
| What we love | Making claims checkable |

- A feature earns its place only if it strengthens one of these and weakens none. "Engagement"
  features that blur the track record (editable calls, hidden losses, vanity metrics) fail this test.
- When unsure whether to build something, ask: *would an auditor sign off on this screen?*

## 2. Systems thinking (Meadows)

Model the product as stocks, flows and feedback loops before changing behaviour.

- **Stocks:** registered calls, resolved track records, caller USDC earnings, reader trust.
- **Reinforcing loop R1:** good record → more unlocks → more caller income → more good callers.
- **Balancing loop B1:** gaming (orphan commits, wash unlocks, sybils, cherry-picked horizons) → lower
  reader trust → fewer unlocks.
- **Leverage points, highest first:** the *rules* (registration window, minimum sample before ranking),
  the *information flows* (salt published at reveal, price provenance, browser verification), and the
  *goal* (verifiable skill, not volume).
- Before changing scoring, ranking or payments, write down which loop it touches and what you expect to
  happen to each stock. Changes to parameters (numbers) are weak levers. Changes to rules and information
  flows are strong ones.

## 3. Lean / TPS

- **Value stream:** commit → register → (unlock) → reveal → score → verify. Any work that doesn't move a
  user along this stream, or protect it, is *muda* (waste). Name it, then cut it.
- **Jidoka (stop the line):** CI runs lint, type-check, tests and build. A red pipeline means nobody merges
  anything else until it's green. Never `--no-verify`, never skip a failing check "for now".
- **Andon:** surface problems loudly and early. A server misconfiguration throws a clear error (see the
  missing-Redis guard in `src/lib/server/store.ts`) instead of silently degrading.
- **Just-in-time:** build the smallest thing that proves the next assumption. Prices resolve lazily when
  they exist. Don't pre-build infrastructure for scale you don't have.
- **Pull, not push:** features come from observed user friction (see §12), not from a backlog of ideas.

## 4. Kaizen

- Prefer many small, reversible improvements to rare big ones. One improvement per PR. A PR should be
  reviewable in under 15 minutes.
- Every change leaves the code slightly better than it found it: a clearer name, a removed branch,
  a test for a bug you just understood.
- The daily plan lives in [KAIZEN.md](KAIZEN.md). Tick items off there, and add the lesson learned in one line.

## 5. 5S (for the codebase)

| S | In this repo |
|---|---|
| **Sort** | Delete dead code, unused deps, stale flags and experiments. If it's not called, it goes. |
| **Set in order** | `src/lib` = shared and pure. `src/lib/server` = server-only (`import "server-only"`). `src/lib/client` = browser-only. `src/components` = UI. `src/app/api` = thin route handlers. Things live where a newcomer would look first. |
| **Shine** | Zero lint warnings, zero type errors, no commented-out code, no `console.log` left behind. |
| **Standardize** | One way to do each thing: zod for input validation, `commitmentHash` for hashing, `priceAt` for prices, `sendWithWallet` for transactions, `fmt*` helpers for display. Don't add a second. |
| **Sustain** | CI enforces Shine. The weekly review (KAIZEN.md, every 7th day) re-runs Sort. |

## 6. Poka-Yoke (mistake-proofing)

Design so the wrong thing is hard or impossible, rather than relying on care.

- **One implementation for the commitment hash.** `src/lib/commitment.ts` is used by the browser, the server
  and the verifier. Never re-implement the preimage. If it must change, bump the version (`poc1` → `poc2`)
  and keep verifying old calls.
- **Validate at the boundary.** Every route parses input with zod before touching RPC, Redis or money.
- **The server never trusts the client's clock or prices.** Commit time is the block time. Prices come from
  the server's own lookup.
- **No 402 for impossible purchases.** Missing or already-public calls are rejected *before* the paywall.
  Payment settles only on a handler result below 400.
- **Before any signature,** the UI shows the cluster, fee payer, program, amount and payee. Never sign or send
  without explicit user action. Default to devnet. Mainnet needs explicit configuration.
- **Type-level guards:** keep `strict` TypeScript. Prefer types that make invalid states unrepresentable
  (e.g. sealed fields are `null` in `PublicCall` until reveal).

## 7. UNIX philosophy

- **Do one thing well:** each module has one job (`prices.ts` prices, `verify.ts` chain verification,
  `store.ts` persistence, `aurora.ts` top-ups). Route handlers stay thin and just compose these.
- **Composable interfaces:** JSON over HTTP, with x402 as the payment layer. An AI agent should be able to use
  every reader feature with `fetch` alone.
- **Text and plain data:** the commitment memo is human-readable (`poc1:<sha256>`), and the preimage is a
  plain JSON array. Anyone can verify a call with standard tools.
- **Small and replaceable:** the store has two backends behind one interface. The price source can be
  swapped behind `priceAt`. Keep those seams.
- **Silence is golden:** log what's actionable (failures, decisions). Don't log what's noise.

## 8. Distributed systems

Treat every external dependency as unreliable, slow and occasionally lying.

- **The chain is the source of truth.** The server state is a cache of what the chain proves. Anything that
  matters for integrity must be re-derivable from chain data plus published salts and prices.
- **Idempotency:** registration is keyed by commit hash and signature, claimed atomically (`SET NX`). Retries
  must be safe. Keep the signature client-side so a failed registration can retry without re-signing.
- **Time:** use block time, never wall clocks from clients. Compare against a server clock only for coarse
  windows (the 10-minute registration window).
- **Eventual consistency is a feature:** entry and exit prices fill in when the market has printed them.
  UIs must show `pending` honestly instead of inventing values.
- **Timeouts and backoff:** every outbound call (RPC, Coinbase, Aurora, facilitator) gets a timeout and a
  bounded retry with jitter. Honour `Retry-After`. Poll Aurora status no faster than every 5–10 s.
- **At-least-once means dedupe:** counters use atomic `INCR`. Derived fields (prices, outcome) are
  deterministic, so a repeated write is harmless.
- **Assume partial failure:** a transaction can land while its confirmation is lost. Reconcile by signature
  before you re-sign or re-pay.

## 9. Blast-radius minimisation

- **One database, one namespace per environment.** Every environment shares one Redis database, so keys are
  prefixed by `VERCEL_ENV` (`keyPrefix()` in `src/lib/server/store.ts`): production keeps `poc:*`, preview
  uses `preview:poc:*`, local dev `development:poc:*`. Never set `VERCEL_ENV=production` locally. A separate
  store per stage is still planned (KAIZEN.md, Day 132).
- **Pushing to `main` deploys production.** Do work on branches, which get preview URLs. Merge only green,
  reviewed, small changes.
- **Feature flags** for anything touching payments, scoring or encryption. Ramp 10% → 50% → 100%.
- **Mainnet money:** test with $0.10–$5, use separate dev wallets, and never put real keys in the repo.
  Server-side signers belong in a KMS (Solana Keychain), not in env-var private keys.
- **Fail closed on writes, degrade gracefully on reads.** A broken dependency must never let an unverified
  call in, or charge a reader for nothing.
- **Small PRs, easy reverts.** If a change can't be rolled back with one `git revert`, split it.

## 10. Chaos engineering

Prove resilience by breaking things on purpose, in preview, never in production first.

- Keep a list of hypotheses: "if X fails, users see Y and nothing is lost or double-charged".
- Standard drills: RPC 500/timeout, Coinbase 429, facilitator down, Redis down, Aurora late deposit or
  refund, wallet rejecting at each step, drand/price source unavailable at reveal, clock skew.
- Each drill writes a short log: hypothesis, method, observed result, fix. A drill that finds nothing still
  counts.
- Re-run the critical drills after any change to `verify.ts`, `store.ts`, the unlock route or payments.

## 11. Theory of Constraints

- At any time there is **one** constraint limiting Proof of Call (today it's real users completing a paid
  unlock; tomorrow it may be RPC latency or caller supply). Name it explicitly in the weekly review.
- The five focusing steps: **identify** the constraint, **exploit** it (get the most out of what exists),
  **subordinate** everything else to it, **elevate** it (invest), **repeat**. Don't let inertia keep an old
  constraint's fixes going after it has moved.
- Optimising anything that isn't the constraint is waste, however satisfying it is.

## 12. Genchi Genbutsu: multi-layered and cross-sectional

"Go and see" at every layer and from every role. Don't reason from the code alone.

- **Layers, for any bug or claim:** the user's screen → browser console/network → our API logs → Redis
  record → RPC response → the transaction in a block explorer → the market data candle. Look at the actual
  artefact at each layer before concluding.
- **Cross-sections, by role:** walk the flow as a **caller** (new wallet, no SOL), a **reader** (USDC on
  another chain), an **AI agent** (fetch + x402 only), a **sceptical auditor** (verify from scratch), and a
  **judge** (cold browser, 60 seconds).
- **Evidence over assertion:** "works" means you saw it work end to end. Report what you tested, what you
  didn't, and the transaction signatures or logs that prove it.

## 13. Ishikawa root-cause analysis

Every incident, wrong score or failed payment gets a fishbone before a fix. Use these bones:

| Bone | Ask |
|---|---|
| **Method** | Was the rule or process wrong (price rule, registration window, scoring)? |
| **Machine** | Infra: Vercel, Redis, RPC, facilitator, Aurora, wallet? |
| **Material** | Data: price candles, token lists, on-chain data, user input? |
| **Measurement** | Did we detect it late or misread it (logs, SLOs, dashboards)? |
| **People** | Missing knowledge, unclear UI, wrong assumption? |
| **Environment** | Cluster, network congestion, market hours, regulation? |

Fix the root cause, then add a poka-yoke or a test so it can't recur silently. Fixing only the symptom is
not done.

## 14. A3 problem solving and Huawei IPD

**A3 (one page per problem or decision):** background → current condition (with data) → goal → root-cause
analysis (fishbone) → countermeasures → plan (who/when) → follow-up (did it work?). Store A3s in
`docs/a3/`. Decisions about payments, trust model, pricing and data sources need an A3.

**IPD (Integrated Product Development):**
- **Market-driven:** every release states which user need it serves and how we'll know.
- **Cross-functional:** product, engineering, security, legal/compliance and GTM views are considered
  *together* at each gate, not one after another.
- **Phase gates with decision checkpoints:** Concept → Plan → Develop → Verify → Launch → Lifecycle. A gate
  passes on evidence (metrics, drills, reviews), not optimism. KAIZEN.md marks the gates.
- **Platform thinking:** shared building blocks (commitment spec, verifier, price interface) are reused, not
  reinvented per feature.

## 15. Samsung TRIZ

When two goals conflict, resolve the contradiction instead of compromising.

- **The founding contradiction:** "calls must be secret *and* provably fixed". This is resolved by
  commit–reveal (separation in time). Next step: time-lock encryption so reveals need no server.
- **Ideal final result:** the system performs the function with no extra element. For example: verification
  that needs no server, payment that needs no account, top-up that needs no bridge UI.
- **Useful inventive principles here:** *segmentation* (sealed vs public fields), *taking out* (move
  unlock into a Blink where the reader already is), *prior action* (commit before the move), *self-service*
  (suggested pricing from the record), *merging* (bundle unlocks with x402 `upto`).
- Write the contradiction down explicitly before brainstorming solutions.

## 16. Dragonwell / AJDK ethos

Alibaba's Dragonwell JDK is proven at production scale, stays compatible with upstream, and contributes
fixes back. Apply the same discipline:

- **Stay on upstream:** official `@solana/kit`, `@x402/*`, Next.js and the Aurora API, with no private forks.
  If we need a fix, we upstream it and carry a patch only until it lands.
- **Production-proven before default:** new dependencies or data sources (e.g. Pyth replacing Coinbase)
  dual-run in preview and are compared on real traffic before they become the default.
- **Long-term stability:** pin versions, upgrade on a branch, soak in preview, then promote. Compatibility
  of the `poc1` commitment format is a long-term promise.
- **Performance from real workloads:** optimise what production data shows is slow, not what feels slow.

## 17. Omotenashi: anticipatory hospitality

Serve the user before they have to ask.

- Show the problem *and* the next step at the moment it matters. Examples: USDC shortfall shown with a
  top-up or faucet link before the payment fails, and a countdown to reveal on sealed calls.
- Every async action has visible pending, success and failure states. No dead ends, no silent spinners.
- Error messages say what happened and what to do next, in plain language. Never show raw stack traces.
- Respect the user's time and money: no surprise signatures, no hidden fees, no payment for something they
  could get free a minute later without being told.
- Treat judges, auditors and AI agents as guests too: clear docs, machine-readable endpoints, honest
  limitations.

---

## Checklists

**Before changing code**
1. Which value-stream step and which feedback loop does this touch? (§2, §3)
2. Is this the current constraint? If not, why now? (§11)
3. What's the blast radius, and how do we roll back? (§9)
4. What did you *see* (layer by layer) that motivates it? (§12)

**Before merging**
1. `pnpm lint`, `npx tsc --noEmit` and the tests pass, with zero warnings. (§3, §5)
2. Inputs validated, no duplicate implementations, server-only code stays server-only. (§5, §6)
3. External calls have timeouts and retries, and writes are idempotent. (§8)
4. UI states covered: pending, success, failure, empty. (§17)
5. For payments, scoring or trust-model changes: an A3 exists and the relevant chaos drill was re-run. (§10, §14)

**After an incident**
1. Fishbone (§13) → A3 (§14) → countermeasure + poka-yoke/test → follow-up date.
2. Add one line to KAIZEN.md with the lesson.
