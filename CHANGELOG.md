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

### Changed
- Prices use Coinbase public candles because Pyth Hermes now requires an API key. This limits scoring to
  crypto assets (SOL, BTC, ETH, JUP, JTO, BONK) for now.
- Aurora integration uses one-time deposit addresses. Persistent addresses are only issued to organisations
  Aurora has approved.
- Pages render from the live store with `connection()`, because `cacheComponents` rejects
  `dynamic = "force-dynamic"`.
- `.gitignore` excludes agent skill files installed by Marketplace integrations (`.agents/`, `.claude/`,
  `skills-lock.json`) and keeps `.env.example`.

### Fixed
- Registration no longer fails when a commit is registered before the market has printed its entry price.
- Local-only `.env.local` Surfpool RPC settings were removed so the dev server reads the real database path.

### Known limitations
- Not yet tested with a real browser wallet (Phantom, Solflare or Backpack) for commit signing or x402 payment.
- Aurora top-up and mainnet x402 have not been exercised. Aurora has no testnet and needs an API key
  (`AURORA_API_KEY`), and mainnet needs `X402_FACILITATOR_URL`.
- Production, preview and local development share one Redis database until keys are split per environment
  (KAIZEN.md, Day 3).
- Unlock receipts are cached per device in `localStorage`. They are not yet re-derived from the reader's
  on-chain payment.
- Commits that are never registered ("orphans") are not yet indexed or flagged.
