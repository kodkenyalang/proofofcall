# Proof of Call

Market calls you can't delete. A caller hashes each call onto Solana **before** the move. The call is scored
against market prices when its horizon ends, and readers pay a few cents over **x402** to read a live call early.
The money goes straight to the caller's wallet. Readers holding funds on other chains top up through
**Aurora Intents**.

Built for the Encode Solana Hackathon 2026 (Best Consumer App · Best Use of x402 · Aurora Intents).

## How it works

| Step | What happens | Where |
|---|---|---|
| Commit | Browser builds the call (asset, direction, horizon, target, thesis, unlock price, random salt) and hashes it. The wallet signs one SPL Memo tx carrying `poc1:<sha256>`. | `src/components/NewCallForm.tsx`, `src/lib/commitment.ts` |
| Register | Server recomputes the hash and checks the tx succeeded, was signed by the caller, and carries that memo. The **block time** becomes the commit time. Registration closes 10 min after the commit, so a caller can't commit long *and* short and register whichever is winning. | `src/app/api/calls/route.ts`, `src/lib/server/verify.ts` |
| Live | Asset and horizon are public. Direction, target and thesis are sealed. `GET /api/calls/:id/unlock` is x402-protected, with `payTo` set to the caller and the price set to the caller's unlock price, in USDC. | `src/app/api/calls/[id]/unlock/route.ts` |
| Score | Entry price is the open of the first full minute after the commit. Exit price is the open of the first full minute after the horizon. Return is signed in the called direction. | `src/lib/server/calls.ts`, `src/lib/server/prices.ts` |
| Audit | At reveal the salt is published. "Verify in my browser" recomputes the hash and re-reads the tx from RPC, so it trusts nothing the server says. | `src/components/VerifyPanel.tsx` |
| Top up | Aurora Swap API `POST /api/quote` (`EXACT_INPUT`, `depositType: ORIGIN_CHAIN`, destination USDC on Solana, recipient = user's wallet) returns a one-time deposit address, and `GET /api/status` is polled every 8s. | `src/lib/server/aurora.ts`, `src/components/TopUpPanel.tsx` |

**Trust model.** Integrity comes from the chain: neither the caller nor the server can backdate or edit a call,
and anyone can re-verify one. The server is trusted only to keep sealed calls confidential until reveal, and to
apply the published price rule.

## Run it

```bash
pnpm install
cp .env.example .env.local     # devnet by default
pnpm dev                        # http://localhost:3000
```

You need a Wallet Standard wallet (Phantom, Solflare, Backpack) on the same cluster. For devnet USDC to test
unlocks, use https://faucet.circle.com.

**Local chain smoke test.** Public devnet airdrops are disabled, so the script runs against Surfpool:

```bash
surfpool start --ci                                            # terminal 1
NEXT_PUBLIC_SOLANA_RPC_URL=http://127.0.0.1:8899 pnpm dev      # terminal 2 (NEXT_PUBLIC_DEMO_HORIZONS=true)
LOCAL=1 node scripts/e2e-devnet.ts                             # commit → register → x402 402 challenge
```

**Mainnet demo** (required for Aurora, which has no testnet):

```
NEXT_PUBLIC_SOLANA_CLUSTER=mainnet
NEXT_PUBLIC_SOLANA_RPC_URL=<a real RPC (Helius, Triton, …)>
X402_FACILITATOR_URL=<mainnet facilitator: PayAI, Dexter, or Coinbase CDP>
AURORA_API_KEY=<from https://studio.aurora.dev>
```

Use small amounts. Aurora recommends deposits of at least $1.

## Known limits / next steps

- **Storage** is Upstash Redis (Vercel Marketplace) when `KV_REST_API_URL`/`UPSTASH_REDIS_REST_URL` are set, and
  a local JSON file (`.data/calls.json`) otherwise. On Vercel, Redis is required.
- **Prices** come from Coinbase public candles, so crypto only. Pyth Hermes now requires an API key; with one,
  swap `prices.ts` to Pyth and add equities (`Equity.US.*`).
- **Unlock receipts** are cached per device. A paid unlock is on chain, so re-granting access could check the
  payer's payment history instead.
- **Orphan commits:** index every `poc1:` memo a caller's wallet ever signed, and flag commits that were never
  registered on their profile.
