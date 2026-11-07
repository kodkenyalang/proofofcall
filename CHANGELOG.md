# Changelog

All notable changes to Proof of Call are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions are not yet tagged:
`v0.1.0` is planned for the hackathon submission (see [KAIZEN.md](KAIZEN.md), Day 10).

## [Unreleased]

### Added
- **On-chain commitments.** A caller hashes a call (asset, direction, horizon, target, price, thesis, random
  salt) and signs one SPL Memo transaction carrying `poc1:<sha256>`. A single shared module
  (`src/lib/commitment.ts`) builds the preimage for the browser, the server and the verifier.
- **Server verification.** Registration recomputes the hash and checks the transaction succeeded, was signed
  by the caller and carries that memo. The block time becomes the commit time. Registration closes 10 minutes
  after the commit.
- **Scoring.** Entry and exit prices are the open of the first full one-minute Coinbase candle at or after the
  commit block time and the horizon end. Entry price fills in lazily once the market has printed it. Return
  is signed in the called direction.
- **x402 unlocks.** `GET /api/calls/:id/unlock` is paid in USDC on Solana, with the payee and price set per
  call so the money goes straight to the caller. Missing or already-public calls are rejected before the
  paywall, and payment settles only on a successful response.
- **In-browser audit.** The call page can recompute the hash from the published fields and salt, and re-read
  the commit transaction from RPC, without trusting the server.
- **Aurora Intents top-up** (mainnet only). Quote via the Swap API (`EXACT_INPUT`, origin-chain deposit,
  Solana USDC destination), one-time deposit address, and status polling every 8 seconds.
- **Pages:** feed with audited leaderboard, new-call form, call page, caller profile and top-up page.
- **Wallet support** through Wallet Standard with transaction v1, falling back to v0 for wallets that cannot
  sign v1.
- **Storage.** Upstash Redis (Vercel Marketplace) when its environment variables are present, with a local
  JSON-file fallback for offline development. Unlock counts use an atomic counter.
- **Deployment.** Vercel project `proof-of-call` linked to this repository and live on devnet at
  https://proof-of-call-nu.vercel.app. `.vercelignore` keeps local env files, `.data/` and `scripts/` out of
  uploads.
- **Tooling.** `scripts/e2e-devnet.ts` smoke test (commit, register, duplicate rejection, x402 challenge),
  runnable against a local Surfpool with `LOCAL=1`.
- **Project docs.** `README.md`, `AGENT.md` (engineering principles applied to this codebase) and
  `KAIZEN.md` (dated 180-day improvement plan built around the 9 Nov 2026, 19:59 GMT+8 deadline).

- **Payable callers.** When the caller's wallet has no USDC account, the commit transaction also creates it
  (idempotent, rent read from the RPC and shown on the review screen). Without it, every x402 payment to that
  caller fails. The unlock route now answers `409` before the paywall when the caller still can't be paid.
- **Tests and CI.** 48 Vitest tests: `poc1` hash parity vectors (a live production call plus an independently
  computed Unicode vector), scoring, the price rule against the real Coinbase candles production scored on,
  `toBaseUnits` and `keyPrefix`. GitHub Actions runs lint (zero warnings), type-check, tests and build on every PR and
  every push to `main`. `pnpm check` runs the same checks locally.
- `scripts/x402-challenge.ts` fetches an unlock URL without paying and checks that the 402 offers the configured
  cluster's USDC, names a facilitator fee payer, and pays the expected caller and amount.
- `scripts/e2e-devnet.ts` takes `KEYPAIR=<funded keypair>` (public devnet airdrops are disabled) and
  `APP_URL=<deployment>`, and creates the caller's USDC account like the UI.

### Changed
- Redis keys are namespaced per Vercel environment (`VERCEL_ENV`). Production keeps `poc:*`; preview and local
  dev write `preview:poc:*` and `development:poc:*`, so they can no longer read or write production calls.
- Redis keys are also namespaced per cluster: mainnet deploys use `mainnet:poc:*`, `preview:mainnet:poc:*` and
  `development:mainnet:poc:*`, so a mainnet feed never lists devnet calls. Devnet keys are unchanged.
- **Mainnet facilitator decided:** PayAI (`https://facilitator.payai.network`), with Dexter as fallback. See
  `docs/a3/2026-11-02-mainnet-facilitator.md`.
- **Mainnet preview:** Git branch `mainnet-preview` deploys with branch-scoped Vercel env
  (`NEXT_PUBLIC_SOLANA_CLUSTER=mainnet`, `X402_FACILITATOR_URL`). Every other preview stays on devnet.
- A rejected Aurora key now reads "Aurora rejected AURORA_API_KEY" instead of the raw HTTP 404 body.
- Prices use Coinbase public candles because Pyth Hermes now requires an API key. This limits scoring to
  crypto assets (SOL, BTC, ETH, JUP, JTO, BONK) for now.
- Aurora integration uses one-time deposit addresses. Persistent addresses are only issued to organisations
  Aurora has approved.
- Pages render from the live store with `connection()`, because `cacheComponents` rejects
  `dynamic = "force-dynamic"`.
- `.gitignore` excludes agent skill files installed by Marketplace integrations (`.agents/`, `.claude/`,
  `skills-lock.json`) and keeps `.env.example`.

### Fixed
- A call that reached its target exactly scored `targetHit: false`, because `(115 / 100 - 1) * 100` is
  `14.999999999999991` in floating point. `scoreCall` now absorbs float error (1e-6 bps). See
  `docs/a3/2026-11-02-exact-target-scoring.md`.
- Registration no longer fails when a commit is registered before the market has printed its entry price.
- Local-only `.env.local` Surfpool RPC settings were removed so the dev server reads the real database path.

### Known limitations
- Not yet tested with a real browser wallet (Phantom, Solflare or Backpack) for commit signing or x402 payment.
- Aurora top-up and mainnet x402 have not been exercised. Aurora has no testnet and needs an API key
  (`AURORA_API_KEY`), and mainnet needs `X402_FACILITATOR_URL`.
- Production, preview and local development still share one Redis database, separated only by key prefix.
- Commits are transaction v1. Solana CLI 4.1.2 (`solana confirm`) cannot read them yet; the in-browser
  verifier and raw JSON-RPC with `maxSupportedTransactionVersion: 1` can.
- Unlock receipts are cached per device in `localStorage`. They are not yet re-derived from the reader's
  on-chain payment.
- Commits that are never registered ("orphans") are not yet indexed or flagged.
