import "server-only";

// Aurora Intents Swap API (https://docs.intents.aurora.dev), used as a "top up from any chain"
// rail: the user sends any supported asset on any chain to a one-off deposit address, and
// receives USDC in their Solana wallet, ready to spend over x402.
// Aurora has no public testnet, so this only runs when the app is on mainnet.

const BASE = "https://intents-api.aurora.dev";

export type AuroraToken = {
  assetId: string;
  decimals: number;
  blockchain: string;
  symbol: string;
  price: number;
  priceUpdatedAt: string;
  contractAddress?: string | null;
};

function apiKey() {
  const key = process.env.AURORA_API_KEY;
  if (!key) throw new Error("AURORA_API_KEY is not set (create one at https://studio.aurora.dev)");
  return encodeURIComponent(key);
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (res.status === 429) {
    throw new Error(`Aurora rate limit hit; retry in ${res.headers.get("Retry-After") ?? "a few"}s`);
  }
  if (!res.ok) throw new Error(`Aurora ${path.split("/")[2]} failed: HTTP ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

// The docs ask integrators to cache the token list for a few minutes.
let tokenCache: { at: number; tokens: AuroraToken[] } | null = null;

export async function auroraTokens(): Promise<AuroraToken[]> {
  if (tokenCache && Date.now() - tokenCache.at < 5 * 60_000) return tokenCache.tokens;
  const body = await call<{ tokens: AuroraToken[] } | AuroraToken[]>(`/api/tokens/${apiKey()}`);
  // The reference schema wraps the list in { tokens }, while one quickstart shows a bare array.
  const tokens = Array.isArray(body) ? body : body.tokens;
  tokenCache = { at: Date.now(), tokens };
  return tokens;
}

export async function solanaUsdc(): Promise<AuroraToken> {
  const usdc = (await auroraTokens()).find((t) => t.blockchain === "sol" && t.symbol === "USDC");
  if (!usdc) throw new Error("Aurora does not list USDC on Solana for this API key");
  return usdc;
}

export type TopUpQuote = {
  depositAddress: string;
  depositMemo?: string;
  amountInFormatted: string;
  amountOutFormatted: string;
  amountOutUsd?: string;
  deadline: string;
  timeEstimate: number;
};

export async function quoteTopUp(input: {
  originAsset: string;
  amount: string; // smallest unit of the origin asset
  refundTo: string; // sender address on the origin chain
  recipient: string; // Solana wallet that receives USDC
}): Promise<TopUpQuote> {
  const usdc = await solanaUsdc();
  const { quote } = await call<{ quote: TopUpQuote }>(`/api/quote/${apiKey()}`, {
    method: "POST",
    body: JSON.stringify({
      dry: false,
      swapType: "EXACT_INPUT",
      depositType: "ORIGIN_CHAIN",
      originAsset: input.originAsset,
      destinationAsset: usdc.assetId,
      amount: input.amount,
      slippageTolerance: 100,
      refundTo: input.refundTo,
      refundType: "ORIGIN_CHAIN",
      recipient: input.recipient,
      recipientType: "DESTINATION_CHAIN",
      deadline: new Date(Date.now() + 60 * 60_000).toISOString(),
    }),
  });
  return quote;
}

export type TopUpStatus = {
  status:
    | "PENDING_DEPOSIT"
    | "KNOWN_DEPOSIT_TX"
    | "INCOMPLETE_DEPOSIT"
    | "PROCESSING"
    | "SUCCESS"
    | "REFUNDED"
    | "FAILED";
  swapDetails?: { destinationChainTxHashes?: { hash: string; explorerUrl: string }[] };
};

export function topUpStatus(depositAddress: string, depositMemo?: string) {
  const q = new URLSearchParams({ depositAddress });
  if (depositMemo) q.set("depositMemo", depositMemo);
  return call<TopUpStatus>(`/api/status/${apiKey()}?${q}`);
}
